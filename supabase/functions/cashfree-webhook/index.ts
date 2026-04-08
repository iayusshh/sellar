// Edge Function: cashfree-webhook
// Canonical source of truth for payment completion.
// Cashfree calls this endpoint; we HMAC-verify the signature before touching the DB.
// Deploy with: supabase functions deploy cashfree-webhook --no-verify-jwt
// (JWT verification is off — Cashfree calls this, not the browser)

import {
  verifyWebhookSignature,
  getSupabaseAdminClient,
  jsonResponse,
  errorResponse,
} from "../_shared/cashfree.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  // ── 1. Read raw body BEFORE parsing (required for HMAC verification) ─────
  const rawBody = await req.text();

  // ── 2. Verify Cashfree HMAC signature ────────────────────────────────────
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const webhookSecret = Deno.env.get("CASHFREE_WEBHOOK_SECRET");

  if (!webhookSecret) {
    console.error("CASHFREE_WEBHOOK_SECRET not configured");
    return errorResponse("Webhook secret not configured", 500);
  }

  const isValid = await verifyWebhookSignature(rawBody, timestamp, signature, webhookSecret);
  if (!isValid) {
    console.warn("Webhook signature verification failed — rejecting request");
    return errorResponse("Invalid webhook signature", 401);
  }

  // ── 3. Parse the webhook payload ─────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON payload", 400);
  }

  const eventType = payload.type as string | undefined;
  const orderData = (payload.data as Record<string, unknown> | undefined)?.order as Record<string, unknown> | undefined;
  const cashfreeOrderId = orderData?.order_id as string | undefined;

  if (!cashfreeOrderId) {
    console.warn("Webhook missing order_id, ignoring:", eventType);
    // Return 200 so Cashfree stops retrying an unrecognised event shape
    return jsonResponse({ received: true });
  }

  // ── 4. Look up our purchase by cashfree_order_id ─────────────────────────
  const adminClient = getSupabaseAdminClient();
  const { data: purchaseRow, error: lookupErr } = await adminClient
    .from("purchases")
    .select("id, status")
    .eq("cashfree_order_id", cashfreeOrderId)
    .single();

  if (lookupErr || !purchaseRow) {
    // Could be a test webhook for an order we don't know about — return 200.
    console.warn("Purchase not found for cashfree_order_id:", cashfreeOrderId);
    return jsonResponse({ received: true });
  }

  const purchaseId: string = purchaseRow.id;

  // ── 5. Dispatch on event type ─────────────────────────────────────────────
  switch (eventType) {
    case "PAYMENT_SUCCESS_WEBHOOK": {
      if (purchaseRow.status === "completed") {
        // Idempotent — already completed by the verify-cashfree-order fast-path.
        console.log("Purchase already completed (idempotent webhook):", purchaseId);
        break;
      }
      const { error: completeErr } = await adminClient.rpc("complete_purchase", {
        p_purchase_id: purchaseId,
      });
      if (completeErr) {
        console.error("complete_purchase error:", completeErr.message);
        // Return 500 so Cashfree retries the webhook
        return errorResponse("Failed to complete purchase", 500);
      }
      console.log("Purchase completed via webhook:", purchaseId);
      break;
    }

    case "PAYMENT_FAILED_WEBHOOK":
    case "PAYMENT_USER_DROPPED_WEBHOOK": {
      const { error: failErr } = await adminClient.rpc("mark_purchase_failed", {
        p_purchase_id: purchaseId,
      });
      if (failErr) {
        console.error("mark_purchase_failed error:", failErr.message);
      }
      console.log(`Purchase marked failed (${eventType}):`, purchaseId);
      break;
    }

    default:
      console.log("Unhandled Cashfree webhook event:", eventType);
  }

  // Always return 200 so Cashfree stops retrying (errors above return early)
  return jsonResponse({ received: true });
});
