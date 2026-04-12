// Shared Cashfree helpers — used by all three Edge Functions.
// Secrets are injected via `supabase secrets set` — never hardcoded.

/// <reference path="./edge-runtime.d.ts" />

import { createClient } from "@supabase/supabase-js";

// ── Cashfree API ─────────────────────────────────────────────────────────────

export const CASHFREE_BASE_URL =
  Deno.env.get("CASHFREE_ENV") === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

export function cashfreeHeaders(): Record<string, string> {
  const appId     = Deno.env.get("CASHFREE_APP_ID");
  const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");
  if (!appId || !secretKey) {
    throw new Error("CASHFREE_APP_ID / CASHFREE_SECRET_KEY not configured");
  }
  return {
    "Content-Type":    "application/json",
    "x-api-version":  "2023-08-01",
    "x-client-id":    appId,
    "x-client-secret": secretKey,
  };
}

// ── Webhook signature verification ──────────────────────────────────────────
// Cashfree signs with HMAC-SHA256(timestamp + rawBody, secret).
// We also enforce a 5-minute replay window to prevent replayed webhooks.

const WEBHOOK_TOLERANCE_SECS = 300; // 5 minutes

function parseWebhookTimestampSeconds(timestamp: string): number | null {
  const trimmed = timestamp.trim();
  if (!trimmed) return null;

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    const seconds = numeric > 1e12 ? Math.floor(numeric / 1000) : Math.floor(numeric);
    return Number.isFinite(seconds) ? seconds : null;
  }

  const parsedMs = Date.parse(trimmed);
  if (!Number.isNaN(parsedMs)) return Math.floor(parsedMs / 1000);

  return null;
}

export async function verifyWebhookSignature(
  rawBody:   string,
  timestamp: string,
  signature: string,
  secret:    string
): Promise<boolean> {
  // Timestamp freshness check (replay protection)
  const ts  = parseWebhookTimestampSeconds(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (ts === null || Math.abs(now - ts) > WEBHOOK_TOLERANCE_SECS) {
    console.warn(`Webhook timestamp out of tolerance: ts=${ts}, now=${now}`);
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(timestamp + rawBody)
  );
  const computed = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
  return computed === signature;
}

// ── Supabase admin client (bypasses RLS) ─────────────────────────────────────

export function getAdminClient() {
  const url     = Deno.env.get("SUPABASE_URL");
  const svcRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !svcRole) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  return createClient(url, svcRole, { auth: { persistSession: false } });
}

// ── CORS ─────────────────────────────────────────────────────────────────────
// Restrict to your site origin in production by setting SITE_URL.
// Falls back to '*' for local development.

function corsOrigin(): string {
  const siteUrl = Deno.env.get("SITE_URL");
  return siteUrl && siteUrl !== "http://localhost:5173" ? siteUrl : "*";
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin":  corsOrigin(),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// ── Response helpers ─────────────────────────────────────────────────────────

export function corsResponse(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

export function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}
