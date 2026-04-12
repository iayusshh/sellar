// Edge Function: cashfree-webhook
// Canonical source of truth for payment state. Cashfree POSTs here after every
// payment event. JWT verification is intentionally disabled (Cashfree is the
// caller, not a browser). We verify authenticity via HMAC-SHA256 instead.
//
// Deploy with: supabase functions deploy cashfree-webhook --no-verify-jwt

import {
  verifyWebhookSignature,
  getAdminClient,
  json,
  err,
} from "../_shared/cashfree.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return err("Method not allowed", 405);

  // ── 1. Read raw body before any parsing (required for HMAC) ─────────────
  const rawBody = await req.text();

  // ── 2. Verify Cashfree HMAC signature + timestamp freshness ─────────────
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const secret    = Deno.env.get("CASHFREE_WEBHOOK_SECRET");

  if (!secret) {
    console.error("CASHFREE_WEBHOOK_SECRET not configured");
    return err("Webhook secret not configured", 500);
  }

  const valid = await verifyWebhookSignature(rawBody, timestamp, signature, secret);
  if (!valid) {
    console.warn("Webhook signature/timestamp verification failed");
    return err("Unauthorized", 401);
  }

  // ── 3. Parse payload ─────────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return err("Invalid JSON payload", 400);
  }

  const eventType  = payload.type as string | undefined;
  const orderData  = (payload.data as Record<string, unknown> | undefined)
                       ?.order as Record<string, unknown> | undefined;
  const cfOrderId  = orderData?.order_id as string | undefined;

  if (!cfOrderId) {
    // Unknown event shape — return 200 so Cashfree stops retrying
    console.log("Webhook: missing order_id, ignoring event:", eventType);
    return json({ received: true });
  }

  // ── 4. Look up our purchase ──────────────────────────────────────────────
  const admin = getAdminClient();
  const { data: purchase, error: lookupErr } = await admin
    .from("purchases")
    .select("id, status")
    .eq("cashfree_order_id", cfOrderId)
    .single();

  if (lookupErr || !purchase) {
    // Could be a Cashfree test event — return 200 so they stop retrying
    console.warn("Webhook: purchase not found for order:", cfOrderId);
    return json({ received: true });
  }

  // ── 5. Dispatch on event type ────────────────────────────────────────────
  switch (eventType) {
    case "PAYMENT_SUCCESS_WEBHOOK": {
      if (purchase.status === "completed") {
        console.log("Webhook: already settled (idempotent):", purchase.id);
        break;
      }
      const { error: settleErr } = await admin.rpc("settle_purchase", {
        p_purchase_id: purchase.id,
      });
      if (settleErr) {
        console.error("settle_purchase error:", settleErr.message);
        // Return 500 → Cashfree will retry
        return err("Failed to settle purchase", 500);
      }
      console.log("Webhook: purchase settled:", purchase.id);
      break;
    }

    case "PAYMENT_FAILED_WEBHOOK":
    case "PAYMENT_USER_DROPPED_WEBHOOK": {
      const { error: failErr } = await admin.rpc("fail_purchase", {
        p_purchase_id: purchase.id,
      });
      if (failErr) console.error("fail_purchase error:", failErr.message);
      console.log(`Webhook: purchase failed (${eventType}):`, purchase.id);
      break;
    }

    default:
      console.log("Webhook: unhandled event type:", eventType);
  }

  // Always 200 — Cashfree retries on any non-2xx
  return json({ received: true });
});
