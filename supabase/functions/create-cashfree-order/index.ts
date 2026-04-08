// Edge Function: create-cashfree-order
// Creates a Cashfree payment order for a product and returns the payment_session_id.
// Called from the browser via supabase.functions.invoke — requires a valid user JWT.

import { createClient } from "@supabase/supabase-js";
import {
  CASHFREE_BASE_URL,
  cashfreeHeaders,
  getSupabaseAdminClient,
  CORS_HEADERS,
  corsResponse,
  jsonResponse,
  errorResponse,
} from "../_shared/cashfree.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  // ── 1. Authenticate the buyer ────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Missing or invalid Authorization header", 401);
  }
  const jwt = authHeader.replace("Bearer ", "");

  // Use the anon client to resolve the JWT → user (Supabase validates signature)
  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
  const { data: { user }, error: userErr } = await anonClient.auth.getUser(jwt);
  if (userErr || !user) {
    return errorResponse("Authentication required", 401);
  }

  const buyerId = user.id;
  const buyerEmail = user.email ?? "";
  const buyerName =
    (user.user_metadata?.display_name as string | undefined) ??
    buyerEmail.split("@")[0] ??
    "Buyer";

  // ── 2. Parse request body ────────────────────────────────────────────────
  let productId: string;
  try {
    const body = await req.json();
    if (!body?.product_id) return errorResponse("product_id is required");
    productId = body.product_id;
  } catch {
    return errorResponse("Invalid JSON body");
  }

  // ── 3. Create a pending purchase row in our DB ───────────────────────────
  const adminClient = getSupabaseAdminClient();
  const { data: pendingRows, error: pendingErr } = await adminClient.rpc(
    "create_pending_purchase",
    {
      p_product_id: productId,
      p_buyer_id: buyerId,
      p_buyer_name: buyerName,
      p_buyer_email: buyerEmail,
    }
  );
  if (pendingErr || !pendingRows?.length) {
    const msg = pendingErr?.message ?? "Failed to create purchase";
    return errorResponse(msg, 422);
  }

  const { purchase_id, amount, currency, product_title } = pendingRows[0];
  const cashfreeOrderId = `sellar_${purchase_id}`;

  // ── 4. Create Cashfree order ─────────────────────────────────────────────
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  let cfResponse: Response;
  try {
    cfResponse = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: "POST",
      headers: cashfreeHeaders(),
      body: JSON.stringify({
        order_id: cashfreeOrderId,
        order_amount: Number(amount),
        order_currency: currency ?? "INR",
        customer_details: {
          customer_id: buyerId,
          customer_email: buyerEmail,
          // Cashfree requires a phone; use a placeholder if not stored.
          // Buyers can enter their real phone in the Drop-in UI.
          customer_phone: "9999999999",
          customer_name: buyerName,
        },
        order_meta: {
          return_url: `${siteUrl}/payment/return?order_id={order_id}`,
          notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`,
        },
        order_note: `Sellar: ${product_title}`,
      }),
    });
  } catch (networkErr) {
    // Network failure creating the Cashfree order
    await adminClient.rpc("mark_purchase_failed", { p_purchase_id: purchase_id });
    return errorResponse("Could not reach Cashfree — please try again", 502);
  }

  if (!cfResponse.ok) {
    const cfError = await cfResponse.text();
    console.error("Cashfree order creation failed:", cfError);
    await adminClient.rpc("mark_purchase_failed", { p_purchase_id: purchase_id });
    return errorResponse("Payment order creation failed — please try again", 502);
  }

  const cfData = await cfResponse.json();
  const paymentSessionId: string = cfData.payment_session_id;

  // ── 5. Persist Cashfree IDs on the pending purchase row ─────────────────
  await adminClient.rpc("set_purchase_cashfree_ids", {
    p_purchase_id: purchase_id,
    p_cf_order_id: cashfreeOrderId,
    p_cf_session_id: paymentSessionId,
  });

  // ── 6. Return session ID + order ID to the client ───────────────────────
  return jsonResponse({
    payment_session_id: paymentSessionId,
    cashfree_order_id: cashfreeOrderId,
    purchase_id,
  });
});
