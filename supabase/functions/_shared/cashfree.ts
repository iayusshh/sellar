// Shared Cashfree helpers for Supabase Edge Functions (Deno)
// All secrets are injected via `supabase secrets set` — never hardcoded.

import { createClient } from "@supabase/supabase-js";

// ─── Cashfree base URL ──────────────────────────────────────────────────────

export const CASHFREE_BASE_URL =
  Deno.env.get("CASHFREE_ENV") === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

// ─── Cashfree request headers ───────────────────────────────────────────────

export function cashfreeHeaders(): Record<string, string> {
  const appId = Deno.env.get("CASHFREE_APP_ID");
  const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");
  if (!appId || !secretKey) {
    throw new Error("CASHFREE_APP_ID / CASHFREE_SECRET_KEY not set");
  }
  return {
    "Content-Type": "application/json",
    "x-api-version": "2023-08-01",
    "x-client-id": appId,
    "x-client-secret": secretKey,
  };
}

// ─── HMAC-SHA256 webhook signature verification ─────────────────────────────
// Cashfree signs webhooks with: HMAC-SHA256(timestamp + rawBody, webhookSecret)
// Header: x-webhook-signature (base64-encoded), x-webhook-timestamp

export async function verifyWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(timestamp + rawBody);
  const keyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign("HMAC", key, data);
  const computedBase64 = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes))
  );

  return computedBase64 === signature;
}

// ─── Supabase admin client (bypasses RLS) ───────────────────────────────────

export function getSupabaseAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

// ─── CORS headers (required for browser-invoked functions) ──────────────────

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function corsResponse(status = 204): Response {
  return new Response(null, { status, headers: CORS_HEADERS });
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}
