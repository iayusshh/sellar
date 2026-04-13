import "../_shared/edge-runtime.d.ts";

import { createClient } from "@supabase/supabase-js";
import { corsResponse, err, getAdminClient, json } from "../_shared/cashfree.ts";

type PurchaseRow = {
  id: string;
  buyer_id: string | null;
  status: string;
  product_id: string | null;
};

type ProductRow = {
  id: string;
  title: string;
  content_url: string | null;
  product_kind: string;
  webinar_scheduled_at: string | null;
  webinar_duration_minutes: number | null;
  webinar_join_early_minutes: number | null;
  webinar_join_late_minutes: number | null;
};

type EntitlementRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseIso(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getWindow(scheduleAt: Date, durationMins: number, earlyJoinMins: number, lateJoinMins: number) {
  const startMs = scheduleAt.getTime() - earlyJoinMins * 60_000;
  const endMs = scheduleAt.getTime() + (durationMins + lateJoinMins) * 60_000;
  return {
    startsAt: new Date(startMs),
    endsAt: new Date(endMs),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "POST") return err("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return err("Missing authorization", 401);

  const jwt = authHeader.slice(7);

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const {
    data: { user },
    error: authErr,
  } = await anonClient.auth.getUser(jwt);

  if (authErr || !user) return err("Authentication required", 401);

  let purchaseId = "";
  let clientSessionId = "";

  try {
    const body = await req.json();
    purchaseId = String(body?.purchase_id ?? "").trim();
    clientSessionId = String(body?.client_session_id ?? "").trim();
  } catch {
    return err("Invalid JSON body");
  }

  if (!isUuid(purchaseId)) return err("Valid purchase_id is required");
  if (!clientSessionId) return err("client_session_id is required");

  const admin = getAdminClient();

  const { data: purchase, error: purchaseErr } = await admin
    .from("purchases")
    .select("id, buyer_id, status, product_id")
    .eq("id", purchaseId)
    .single<PurchaseRow>();

  if (purchaseErr || !purchase) return err("Purchase not found", 404);
  if (purchase.buyer_id !== user.id) return err("Forbidden", 403);
  if (purchase.status !== "completed") return err("Purchase is not completed yet", 409);
  if (!purchase.product_id) return err("Purchase has no linked product", 422);

  const { data: product, error: productErr } = await admin
    .from("products")
    .select(
      "id, title, content_url, product_kind, webinar_scheduled_at, webinar_duration_minutes, webinar_join_early_minutes, webinar_join_late_minutes"
    )
    .eq("id", purchase.product_id)
    .single<ProductRow>();

  if (productErr || !product) return err("Product not found", 404);
  if (product.product_kind !== "webinar") return err("This purchase is not a webinar", 409);
  if (!product.content_url) return err("Creator has not configured a webinar join URL yet", 422);

  const { data: entitlement } = await admin
    .from("webinar_entitlements")
    .select("id, scheduled_at, duration_minutes")
    .eq("purchase_id", purchase.id)
    .maybeSingle<EntitlementRow>();

  if (!entitlement) {
    return err("Webinar access has not been provisioned yet. Please retry shortly.", 409);
  }

  const scheduleAt = parseIso(entitlement.scheduled_at ?? product.webinar_scheduled_at);
  const durationMinutes = entitlement.duration_minutes ?? product.webinar_duration_minutes;

  if (!scheduleAt || !durationMinutes) {
    return err("Webinar schedule is incomplete. Please contact the creator.", 422);
  }

  const earlyJoinMinutes = Math.max(0, product.webinar_join_early_minutes ?? 10);
  const lateJoinMinutes = Math.max(0, product.webinar_join_late_minutes ?? 30);
  const now = new Date();

  const window = getWindow(scheduleAt, durationMinutes, earlyJoinMinutes, lateJoinMinutes);

  if (now < window.startsAt) {
    return json(
      {
        error: "Webinar has not started yet",
        reason: "too_early",
        starts_at: window.startsAt.toISOString(),
        scheduled_at: scheduleAt.toISOString(),
        server_time: now.toISOString(),
      },
      409
    );
  }

  if (now > window.endsAt) {
    return json(
      {
        error: "Webinar window has ended",
        reason: "ended",
        ends_at: window.endsAt.toISOString(),
        scheduled_at: scheduleAt.toISOString(),
        server_time: now.toISOString(),
      },
      409
    );
  }

  // Close expired sessions so one-active-session uniqueness can remain strict.
  await admin
    .from("webinar_join_sessions")
    .update({ left_at: now.toISOString() })
    .eq("purchase_id", purchase.id)
    .is("left_at", null)
    .is("revoked_at", null)
    .lt("expires_at", now.toISOString());

  const { data: activeSession } = await admin
    .from("webinar_join_sessions")
    .select("id, client_session_id")
    .eq("purchase_id", purchase.id)
    .is("left_at", null)
    .is("revoked_at", null)
    .maybeSingle<{ id: string; client_session_id: string }>();

  if (activeSession && activeSession.client_session_id !== clientSessionId) {
    return err("This webinar is already active on another device/session", 409);
  }

  const expiresAt = new Date(Math.min(window.endsAt.getTime(), now.getTime() + 8 * 60_000));

  if (activeSession) {
    const { error: updateErr } = await admin
      .from("webinar_join_sessions")
      .update({ expires_at: expiresAt.toISOString(), joined_at: now.toISOString() })
      .eq("id", activeSession.id);

    if (updateErr) {
      console.error("Failed to update webinar join session", updateErr.message);
      return err("Could not refresh webinar access. Please retry.", 500);
    }
  } else {
    const { error: insertErr } = await admin.from("webinar_join_sessions").insert({
      entitlement_id: entitlement.id,
      purchase_id: purchase.id,
      buyer_id: user.id,
      client_session_id: clientSessionId,
      issued_at: now.toISOString(),
      joined_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    if (insertErr) {
      console.error("Failed to create webinar join session", insertErr.message);
      return err("Could not create webinar access. Please retry.", 500);
    }
  }

  return json({
    join_url: product.content_url,
    expires_at: expiresAt.toISOString(),
    scheduled_at: scheduleAt.toISOString(),
    server_time: now.toISOString(),
    title: product.title,
  });
});
