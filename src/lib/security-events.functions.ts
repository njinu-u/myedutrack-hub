import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface SecurityEvent {
  id: string;
  created_at: string;
  event_type: string;
  severity: string;
  actor_user_id: string | null;
  actor_email: string | null;
  school_id: string | null;
  target_user_id: string | null;
  message: string;
  details: Record<string, unknown>;
}

const ListSchema = z.object({
  severity: z.enum(["info", "low", "medium", "high", "critical"]).optional(),
  event_type: z.string().min(1).max(64).optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const listSecurityEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ListSchema.parse(d ?? {}))
  .handler(async ({ context, data }): Promise<SecurityEvent[]> => {
    const { supabase, userId } = context;
    const { data: me } = await supabase
      .from("app_users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (!me || me.role !== "super_admin") {
      throw new Error("Forbidden: website owner only");
    }
    let q = supabaseAdmin
      .from("security_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.severity) q = q.eq("severity", data.severity);
    if (data.event_type) q = q.eq("event_type", data.event_type);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as SecurityEvent[];
  });

/** Server-side helper for logging from other server functions. */
export async function recordSecurityEvent(args: {
  event_type: string;
  severity?: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  details?: Record<string, unknown>;
  actor_user_id?: string | null;
  actor_email?: string | null;
  school_id?: string | null;
  target_user_id?: string | null;
}) {
  try {
    await supabaseAdmin.from("security_events").insert({
      event_type: args.event_type,
      severity: args.severity ?? "info",
      message: args.message,
      details: args.details ?? {},
      actor_user_id: args.actor_user_id ?? null,
      actor_email: args.actor_email ?? null,
      school_id: args.school_id ?? null,
      target_user_id: args.target_user_id ?? null,
    });
  } catch (e) {
    console.error("[security-events] failed to record", e);
  }
}
