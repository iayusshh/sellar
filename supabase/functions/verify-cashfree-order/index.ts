// Edge Function: verify-cashfree-order
// Reconciliation fast-path called by the client right after the Drop-in SDK's
// onSuccess callback, and again from the /payment/return redirect page.
// Queries Cashfree directly so we don't wait on the webhook.
// settle_purchase and fail_purchase are both idempotent — safe to race with
// the canonical webhook handler.

import { createClient } from "@supabase/supabase-js";
import {
  CASHFREE_BASE_URL,
  cashfreeHeaders,
  getAdminClient,
  corsResponse,
  json,
  err,
} from "../_shared/cashfree.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return err("Method not allowed", 405);

  // ── 1. Authenticate buyer ────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return err("Missing authorization", 401);

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return err("Authentication required", 401);

  // ── 2. Parse body ────────────────────────────────────────────────────────
  let cfOrderId: string;
  try {
    const body = await req.json();
    if (!body?.cashfree_order_id) return err("cashfree_order_id is required");
    cfOrderId = body.cashfree_order_id;
  } catch {
    return err("Invalid JSON body");
  }

  // ── 3. Verify this order belongs to the authenticated buyer ──────────────
  const admin = getAdminClient();
  const { data: purchase, error: lookupErr } = await admin
    .from("purchases")
    .select("id, status, buyer_id")
    .eq("cashfree_order_id", cfOrderId)
    .single();

  if (lookupErr || !purchase) return err("Purchase not found", 404);
  if (purchase.buyer_id !== user.id) return err("Forbidden", 403);

  // Already settled — skip the Cashfree round-trip
  if (purchase.status === "completed") return json({ status: "completed" });
  if (purchase.status === "failed")    return json({ status: "failed" });

  // ── 4. Query Cashfree for live order status ──────────────────────────────
  let cfRes: Response;
  try {
    cfRes = await fetch(`${CASHFREE_BASE_URL}/orders/${cfOrderId}`, {
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

  // ── 5. Act on Cashfree status ────────────────────────────────────────────
  if (order_status === "PAID") {
    const { error: settleErr } = await admin.rpc("settle_purchase", {
      p_purchase_id: purchase.id,
    });
    if (settleErr) {
      console.error("settle_purchase failed:", settleErr.message);
      return err("Failed to complete purchase — please contact support", 500);
    }
    return json({ status: "completed" });
  }

  if (order_status === "EXPIRED" || order_status === "TERMINATED") {
    await admin.rpc("fail_purchase", { p_purchase_id: purchase.id });
    return json({ status: "failed" });
  }

  // ACTIVE — payment still in progress
  return json({ status: "pending" });
});
