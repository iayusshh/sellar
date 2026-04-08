// Edge Function: verify-cashfree-order
// Reconciliation fast-path: called by the client right after the Drop-in SDK's
// onSuccess callback, and from the /payment/return page.
// Hits Cashfree's Get-Order API and, if PAID, calls complete_purchase directly.
// This ensures the buyer sees instant confirmation even if the webhook is delayed.

import { createClient } from "@supabase/supabase-js";
import {
  CASHFREE_BASE_URL,
  cashfreeHeaders,
  getSupabaseAdminClient,
  corsResponse,
  jsonResponse,
  errorResponse,
} from "../_shared/cashfree.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  // ── 1. Authenticate the buyer ────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Missing or invalid Authorization header", 401);
  }
  const jwt = authHeader.replace("Bearer ", "");

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
  const { data: { user }, error: userErr } = await anonClient.auth.getUser(jwt);
  if (userErr || !user) {
    return errorResponse("Authentication required", 401);
  }

  // ── 2. Parse request body ────────────────────────────────────────────────
  let cashfreeOrderId: string;
  try {
    const body = await req.json();
    if (!body?.cashfree_order_id) return errorResponse("cashfree_order_id is required");
    cashfreeOrderId = body.cashfree_order_id;
  } catch {
    return errorResponse("Invalid JSON body");
  }

  // ── 3. Verify this order belongs to the authenticated buyer ──────────────
  // This prevents a buyer from completing someone else's purchase.
  const adminClient = getSupabaseAdminClient();
  const { data: purchaseRows, error: lookupErr } = await adminClient
    .from("purchases")
    .select("id, status, buyer_id")
    .eq("cashfree_order_id", cashfreeOrderId)
    .single();

  if (lookupErr || !purchaseRows) {
    return errorResponse("Purchase not found", 404);
  }
  if (purchaseRows.buyer_id !== user.id) {
    return errorResponse("Forbidden", 403);
  }

  // Already completed — nothing to do (idempotent fast-path)
  if (purchaseRows.status === "completed") {
    return jsonResponse({ status: "completed" });
  }

  const purchaseId: string = purchaseRows.id;

  // ── 4. Query Cashfree for the live order status ──────────────────────────
  let cfResponse: Response;
  try {
    cfResponse = await fetch(`${CASHFREE_BASE_URL}/orders/${cashfreeOrderId}`, {
      method: "GET",
      headers: cashfreeHeaders(),
    });
  } catch {
    return errorResponse("Could not reach Cashfree — please try again", 502);
  }

  if (!cfResponse.ok) {
    const cfError = await cfResponse.text();
    console.error("Cashfree Get-Order failed:", cfError);
    return errorResponse("Failed to verify order status", 502);
  }

  const cfData = await cfResponse.json();
  const orderStatus: string = cfData.order_status; // PAID | ACTIVE | EXPIRED | TERMINATED

  // ── 5. Act on the Cashfree status ────────────────────────────────────────
  if (orderStatus === "PAID") {
    // complete_purchase is idempotent — safe if the webhook already ran
    const { error: completeErr } = await adminClient.rpc("complete_purchase", {
      p_purchase_id: purchaseId,
    });
    if (completeErr) {
      console.error("complete_purchase failed:", completeErr.message);
      return errorResponse("Failed to complete purchase — please contact support", 500);
    }
    return jsonResponse({ status: "completed" });
  }

  if (orderStatus === "EXPIRED" || orderStatus === "TERMINATED") {
    await adminClient.rpc("mark_purchase_failed", { p_purchase_id: purchaseId });
    return jsonResponse({ status: "failed" });
  }

  // ACTIVE — payment still in progress
  return jsonResponse({ status: "pending" });
});
