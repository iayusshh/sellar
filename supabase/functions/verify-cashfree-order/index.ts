// Edge Function: verify-cashfree-order
// Reconciliation fast-path called by the client right after the Drop-in SDK's
// onSuccess callback, and again from the /payment/return redirect page.
// Queries Cashfree directly so we don't wait on the webhook.
// settle_purchase and fail_purchase are both idempotent — safe to race with
// the canonical webhook handler.

/// <reference path="../_shared/edge-runtime.d.ts" />

import {
  CASHFREE_BASE_URL,
  cashfreeHeaders,
  getAdminClient,
  corsResponse,
  json,
  err,
} from "../_shared/cashfree.ts";

function extractPurchaseId(orderId: string): string | null {
  const trimmed = orderId.trim();
  const sellarMatch = trimmed.match(/^sellar_([0-9a-fA-F-]{36})$/);
  if (sellarMatch) return sellarMatch[1];

  const uuidMatch = trimmed.match(/^([0-9a-fA-F-]{36})$/);
  if (uuidMatch) return uuidMatch[1];

  return null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getHintedBuyerId(authHeader: string): string | null {
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  const sub = payload?.sub;
  return typeof sub === "string" && sub ? sub : null;
}

function collectPaymentStatuses(payload: unknown): string[] {
  const statuses: string[] = [];

  const pushStatus = (value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      statuses.push(value.toUpperCase());
    }
  };

  const fromRecord = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    const rec = value as Record<string, unknown>;

    pushStatus(rec.payment_status);
    pushStatus(rec.status);

    const nested = [rec.payments, rec.data, rec.cf_payments, rec.payment_details];
    for (const item of nested) {
      if (Array.isArray(item)) {
        item.forEach(fromRecord);
      } else {
        fromRecord(item);
      }
    }
  };

  if (Array.isArray(payload)) {
    payload.forEach(fromRecord);
  } else {
    fromRecord(payload);
  }

  return [...new Set(statuses)];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return err("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const hintedBuyerId = getHintedBuyerId(authHeader);

  // ── 1. Parse body ────────────────────────────────────────────────────────
  let cfOrderId: string;
  try {
    const body = await req.json();
    if (!body?.cashfree_order_id) return err("cashfree_order_id is required");
    cfOrderId = String(body.cashfree_order_id).trim();
  } catch {
    return err("Invalid JSON body");
  }

  // ── 2. Find purchase row by Cashfree order id ────────────────────────────
  const admin = getAdminClient();
  let { data: purchase, error: lookupErr } = await admin
    .from("purchases")
    .select("id, status, buyer_id, product_id, cashfree_order_id")
    .eq("cashfree_order_id", cfOrderId)
    .single();

  // Backward-compatible fallback: derive purchase UUID from order id.
  // Covers flows where redirect returns a variant id format.
  if (lookupErr || !purchase) {
    const purchaseId = extractPurchaseId(cfOrderId);
    if (purchaseId) {
      const fallback = await admin
        .from("purchases")
          .select("id, status, buyer_id, product_id, cashfree_order_id")
        .eq("id", purchaseId)
        .single();
      purchase = fallback.data;
      lookupErr = fallback.error;
    }
  }

  if (lookupErr || !purchase) {
    console.warn("verify-cashfree-order: purchase not found", {
      order_id: cfOrderId,
    });

    // Fallback: if return param carried an unexpected order id, try the
    // buyer's latest pending/failed Cashfree attempt.
    if (hintedBuyerId) {
      const fallback = await admin
        .from("purchases")
        .select("id, status, buyer_id, product_id, cashfree_order_id")
        .eq("buyer_id", hintedBuyerId)
        .eq("payment_provider", "cashfree")
        .in("status", ["pending", "failed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallback.data?.cashfree_order_id) {
        purchase = fallback.data;
        lookupErr = null;
      } else {
        return json({ status: "pending", reason: "purchase_not_found" });
      }
    } else {
      return json({ status: "pending", reason: "purchase_not_found" });
    }
  }

  const purchaseWasFailed = purchase.status === "failed";

  const settleWithRecovery = async (): Promise<Response> => {
    if (purchaseWasFailed) {
      // If another pending row exists for the same buyer+product (from retries),
      // clear it first so we can recover this successful failed row.
      const { error: clearPendingErr } = await admin
        .from("purchases")
        .update({ status: "failed" })
        .eq("buyer_id", purchase.buyer_id)
        .eq("product_id", purchase.product_id)
        .eq("status", "pending")
        .neq("id", purchase.id);

      if (clearPendingErr) {
        console.error("Conflicting pending-row cleanup failed:", clearPendingErr.message);
      }

      const { error: recoverErr } = await admin
        .from("purchases")
        .update({ status: "pending" })
        .eq("id", purchase.id)
        .eq("status", "failed");

      if (recoverErr) {
        console.error("Failed purchase recovery failed:", recoverErr.message);
        return err("Failed to recover purchase state — please contact support", 500);
      }
    }

    const { error: settleErr } = await admin.rpc("settle_purchase", {
      p_purchase_id: purchase.id,
    });

    if (settleErr) {
      console.error("settle_purchase failed:", settleErr.message);
      return err("Failed to complete purchase — please contact support", 500);
    }

    return json({ status: "completed" });
  };

  // Already settled — skip the Cashfree round-trip
  if (purchase.status === "completed") return json({ status: "completed" });

  const cashfreeOrderId = purchase.cashfree_order_id ?? cfOrderId;

  // ── 4. Query Cashfree for live order status ──────────────────────────────
  let cfRes: Response;
  try {
    cfRes = await fetch(`${CASHFREE_BASE_URL}/orders/${cashfreeOrderId}`, {
      method:  "GET",
      headers: cashfreeHeaders(),
    });
  } catch {
    return err("Could not reach Cashfree — please try again", 502);
  }

  if (!cfRes.ok) {
    console.error("Cashfree get-order failed:", await cfRes.text());
    return err("Failed to verify order status", 502);
  }

  const { order_status }: { order_status: string } = await cfRes.json();
  const normalizedOrderStatus = String(order_status ?? "").toUpperCase();

  // ── 5. Act on Cashfree status ────────────────────────────────────────────
  if (normalizedOrderStatus === "PAID" || normalizedOrderStatus === "SUCCESS") {
    return await settleWithRecovery();
  }

  if (
    normalizedOrderStatus === "EXPIRED" ||
    normalizedOrderStatus === "TERMINATED" ||
    normalizedOrderStatus === "FAILED"
  ) {
    await admin.rpc("fail_purchase", { p_purchase_id: purchase.id });
    return json({ status: "failed" });
  }

  // Fallback: some flows can lag order_status updates while payment is already
  // successful. Inspect payment attempts and settle on SUCCESS.
  try {
    const successStatuses = new Set(["SUCCESS", "PAID", "CHARGED", "CAPTURED", "AUTHORIZED"]);
    const terminalFailureStatuses = new Set(["FAILED", "CANCELLED", "USER_DROPPED", "VOID"]);

    let paymentStatuses: string[] = [];
    const paymentsRes = await fetch(
      `${CASHFREE_BASE_URL}/orders/${cashfreeOrderId}/payments`,
      { method: "GET", headers: cashfreeHeaders() }
    );

    if (paymentsRes.ok) {
      const paymentsPayload = await paymentsRes.json() as unknown;
      paymentStatuses = collectPaymentStatuses(paymentsPayload);
      const hasSuccessfulPayment = paymentStatuses.some((status) => successStatuses.has(status));

      if (hasSuccessfulPayment) {
        return await settleWithRecovery();
      }

      const hasTerminalFailure = paymentStatuses.some((status) =>
        terminalFailureStatuses.has(status)
      );

      if (hasTerminalFailure) {
        await admin.rpc("fail_purchase", { p_purchase_id: purchase.id });
        return json({ status: "failed" });
      }

      return json({
        status: "pending",
        reason: "cashfree_pending",
        order_status: normalizedOrderStatus,
        payment_statuses: paymentStatuses,
      });
    }

    return json({
      status: "pending",
      reason: "payments_lookup_failed",
      order_status: normalizedOrderStatus,
    });
  } catch {
    // Non-fatal fallback check.
  }

  // ACTIVE — payment still in progress
  if (purchaseWasFailed) {
    return json({
      status: "failed",
      reason: "cashfree_not_confirmed",
      order_status: normalizedOrderStatus,
    });
  }

  return json({
    status: "pending",
    reason: "cashfree_pending",
    order_status: normalizedOrderStatus,
  });
});
