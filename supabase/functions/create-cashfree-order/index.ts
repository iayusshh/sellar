// Edge Function: create-cashfree-order
// Authenticated by the buyer's JWT.
// 1. Calls begin_purchase RPC  → creates/reuses a pending purchase row.
// 2. Calls Cashfree Orders API → mints the payment session.
// 3. Calls attach_cashfree_order RPC → stamps the Cashfree IDs on the row.
// Returns { payment_session_id, cashfree_order_id, purchase_id } to the client.

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
  // Create a user-scoped client from the incoming Authorization header.
  // Supabase's JWT middleware has already verified the token at this point,
  // so we just need to hydrate the user object from it.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return err("Missing authorization", 401);

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return err("Authentication required", 401);

  const buyerId    = user.id;
  const buyerEmail = user.email ?? "";
  const buyerName  =
    (user.user_metadata?.display_name as string | undefined) ??
    buyerEmail.split("@")[0] ??
    "Buyer";

  // ── 2. Parse body ────────────────────────────────────────────────────────
  let productId: string;
  try {
    const body = await req.json();
    if (!body?.product_id) return err("product_id is required");
    productId = body.product_id;
  } catch {
    return err("Invalid JSON body");
  }

  // ── 3. Create / reuse a pending purchase row ─────────────────────────────
  const admin = getAdminClient();
  const { data: rows, error: beginErr } = await admin.rpc("begin_purchase", {
    p_product_id:  productId,
    p_buyer_id:    buyerId,
    p_buyer_name:  buyerName,
    p_buyer_email: buyerEmail,
  });

  if (beginErr || !rows?.length) {
    return err(beginErr?.message ?? "Could not initiate purchase", 422);
  }

  const { purchase_id, amount, currency, product_title } = rows[0];
  const cfOrderId = `sellar_${purchase_id}`;

  // ── 4. Create Cashfree order ─────────────────────────────────────────────
  const siteUrl     = Deno.env.get("SITE_URL") ?? "http://localhost:5173";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  let cfRes: Response;
  try {
    cfRes = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method:  "POST",
      headers: cashfreeHeaders(),
      body: JSON.stringify({
        order_id:       cfOrderId,
        order_amount:   Number(amount),
        order_currency: currency ?? "INR",
        customer_details: {
          customer_id:    buyerId,
          customer_email: buyerEmail,
          customer_phone: "9999999999", // placeholder — buyer enters real number in Drop-in
          customer_name:  buyerName,
        },
        order_meta: {
          return_url: `${siteUrl}/payment/return?order_id={order_id}`,
          notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`,
        },
        order_note: `Sellar: ${product_title}`,
      }),
    });
  } catch {
    await admin.rpc("fail_purchase", { p_purchase_id: purchase_id });
    return err("Could not reach Cashfree — please try again", 502);
  }

  if (!cfRes.ok) {
    console.error("Cashfree order creation failed:", await cfRes.text());
    await admin.rpc("fail_purchase", { p_purchase_id: purchase_id });
    return err("Payment order creation failed — please try again", 502);
  }

  const cfData: { payment_session_id: string } = await cfRes.json();

  // ── 5. Stamp the Cashfree IDs on the purchase row ───────────────────────
  const { error: attachErr } = await admin.rpc("attach_cashfree_order", {
    p_purchase_id:   purchase_id,
    p_cf_order_id:   cfOrderId,
    p_cf_session_id: cfData.payment_session_id,
  });
  if (attachErr) {
    console.error("attach_cashfree_order failed:", attachErr.message);
    // Non-fatal: purchase row exists; buyer can still proceed. Log and continue.
  }

  // ── 6. Return session to client ──────────────────────────────────────────
  return json({
    payment_session_id: cfData.payment_session_id,
    cashfree_order_id:  cfOrderId,
    purchase_id,
  });
});
