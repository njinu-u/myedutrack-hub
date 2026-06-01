import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PILOT_WEEKS = 12;
const PILOT_MS = PILOT_WEEKS * 7 * 24 * 60 * 60 * 1000;
const GRACE_DAYS = 7;
const PRICE_USD = "50.00";

export interface SubscriptionStatus {
  schoolId: string | null;
  schoolName: string | null;
  role: string | null;
  isPaid: boolean;
  paidUntil: string | null;
  pilotStartDate: string | null;
  pilotEndsAt: string | null;
  pilotEnded: boolean;
  daysUntilExpiry: number | null;
  needsPayment: boolean;          // admin: show paywall
  lockedForNonAdmin: boolean;     // teacher/parent/student/counselor: hard lock after grace
}

export const getSubscriptionStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionStatus> => {
    const { supabase } = context;
    const { data: appUser } = await supabase
      .from("app_users")
      .select("role,school_id")
      .maybeSingle();

    if (!appUser?.school_id) {
      return {
        schoolId: null, schoolName: null, role: appUser?.role ?? null,
        isPaid: false, paidUntil: null, pilotStartDate: null, pilotEndsAt: null,
        pilotEnded: false, daysUntilExpiry: null,
        needsPayment: false, lockedForNonAdmin: false,
      };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("id,name,is_paid,paid_until,pilot_start_date")
      .eq("id", appUser.school_id)
      .maybeSingle();

    const now = Date.now();
    const pilotStart = school?.pilot_start_date ? new Date(school.pilot_start_date).getTime() : null;
    const pilotEndsAtMs = pilotStart !== null ? pilotStart + PILOT_MS : null;
    const pilotEnded = pilotEndsAtMs !== null && now >= pilotEndsAtMs;
    const paidUntilMs = school?.paid_until ? new Date(school.paid_until).getTime() : null;
    const paidActive = !!school?.is_paid && paidUntilMs !== null && paidUntilMs >= now;

    const daysUntilExpiry = paidUntilMs !== null
      ? Math.ceil((paidUntilMs - now) / (24 * 60 * 60 * 1000))
      : null;

    const isAdmin = appUser.role === "school_admin";
    const needsPayment = isAdmin && pilotEnded && !paidActive;

    // Non-admins: lock if pilot ended and (no paid subscription OR paid expired beyond grace)
    const graceCutoffMs = paidUntilMs !== null
      ? paidUntilMs + GRACE_DAYS * 24 * 60 * 60 * 1000
      : pilotEndsAtMs !== null ? pilotEndsAtMs + GRACE_DAYS * 24 * 60 * 60 * 1000 : null;
    const lockedForNonAdmin = !isAdmin && !paidActive && graceCutoffMs !== null && now >= graceCutoffMs;

    return {
      schoolId: school?.id ?? null,
      schoolName: school?.name ?? null,
      role: appUser.role,
      isPaid: paidActive,
      paidUntil: school?.paid_until ?? null,
      pilotStartDate: school?.pilot_start_date ?? null,
      pilotEndsAt: pilotEndsAtMs !== null ? new Date(pilotEndsAtMs).toISOString() : null,
      pilotEnded,
      daysUntilExpiry,
      needsPayment,
      lockedForNonAdmin,
    };
  });

export const PAYPAL_PRICE_USD = PRICE_USD;
export const PAYPAL_DESCRIPTION = "EduTrack School Plan – Annual Subscription";

const RecordSchema = z.object({
  orderId: z.string().min(1).max(120),
});

async function verifyPaypalOrder(orderId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const base = (process.env.PAYPAL_ENV ?? "live").toLowerCase() === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
  if (!clientId || !clientSecret) {
    return { ok: false, error: "Payment verification is not configured. Please contact support." };
  }
  // OAuth token
  const tokenResp = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!tokenResp.ok) return { ok: false, error: "Could not authenticate with payment provider." };
  const tokenJson = (await tokenResp.json()) as { access_token?: string };
  if (!tokenJson.access_token) return { ok: false, error: "Payment provider returned no token." };
  // Verify order
  const orderResp = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!orderResp.ok) return { ok: false, error: "Payment order could not be verified." };
  const order = (await orderResp.json()) as {
    status?: string;
    purchase_units?: Array<{ amount?: { value?: string; currency_code?: string } }>;
  };
  if (order.status !== "COMPLETED" && order.status !== "APPROVED") {
    return { ok: false, error: `Payment not completed (status: ${order.status ?? "unknown"}).` };
  }
  const unit = order.purchase_units?.[0]?.amount;
  if (!unit || unit.currency_code !== "USD" || unit.value !== PRICE_USD) {
    return { ok: false, error: "Payment amount does not match the subscription price." };
  }
  return { ok: true };
}

export const recordPaypalPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RecordSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: appUser } = await supabase
      .from("app_users")
      .select("role,school_id")
      .eq("id", userId)
      .maybeSingle();
    if (!appUser || appUser.role !== "school_admin" || !appUser.school_id) {
      return { ok: false as const, error: "Only the school admin can complete payment." };
    }

    // Replay protection: reject if this order was already redeemed
    const { data: existing } = await supabaseAdmin
      .from("schools")
      .select("id")
      .eq("paypal_order_id", data.orderId)
      .maybeSingle();
    if (existing && existing.id !== appUser.school_id) {
      return { ok: false as const, error: "This payment order has already been used." };
    }

    // Verify with PayPal server-side
    const verification = await verifyPaypalOrder(data.orderId);
    if (!verification.ok) return { ok: false as const, error: verification.error };

    const paidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);
    const { error } = await supabaseAdmin
      .from("schools")
      .update({
        is_paid: true,
        paid_until: paidUntil,
        paypal_order_id: data.orderId,
        plan: "school",
        status: "active",
        activated_at: new Date().toISOString(),
        admin_user_id: userId,
      })
      .eq("id", appUser.school_id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, paidUntil };
  });
