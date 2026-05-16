import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ROLE = z.enum(["teacher", "counselor", "parent", "student"]);

function genCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export const listInvitations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("school_invitations")
      .select("id,code,role,email,linked_student_id,expires_at,used_at,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { invitations: data ?? [] };
  });

export const createInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    role: ROLE,
    email: z.string().email().optional().nullable(),
    linked_student_id: z.string().uuid().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase.from("app_users").select("school_id,role").eq("id", userId).maybeSingle();
    if (!me?.school_id || me.role !== "school_admin") throw new Error("Forbidden");

    const code = genCode();
    const { data: row, error } = await supabase
      .from("school_invitations")
      .insert({
        school_id: me.school_id,
        role: data.role,
        email: data.email ?? null,
        linked_student_id: data.linked_student_id ?? null,
        code,
      })
      .select("id,code,role,email,linked_student_id,expires_at,used_at,created_at")
      .single();
    if (error) throw new Error(error.message);
    return { invitation: row };
  });

// Public — no auth middleware. Looks up by code for the join page (returns minimal info).
export const lookupInvitation = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: z.string().trim().min(4).max(32) }).parse(d))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from("school_invitations")
      .select("id,role,email,linked_student_id,expires_at,used_at,school_id")
      .eq("code", data.code.toUpperCase())
      .maybeSingle();
    if (!row) return { ok: false as const, error: "Invalid code" };
    if (row.used_at) return { ok: false as const, error: "This invitation has already been used" };
    if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false as const, error: "This invitation has expired" };
    const { data: school } = await supabaseAdmin.from("schools").select("name").eq("id", row.school_id).maybeSingle();
    return { ok: true as const, invitation: { role: row.role, email: row.email, school_name: school?.name ?? "your school" } };
  });

// Redeem — creates auth user + app_users row + marks invitation used.
export const redeemInvitation = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    code: z.string().trim().min(4).max(32),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    full_name: z.string().trim().min(1).max(120),
  }).parse(d))
  .handler(async ({ data }) => {
    const { data: inv } = await supabaseAdmin
      .from("school_invitations")
      .select("id,role,email,linked_student_id,expires_at,used_at,school_id")
      .eq("code", data.code.toUpperCase())
      .maybeSingle();
    if (!inv) return { ok: false as const, error: "Invalid code" };
    if (inv.used_at) return { ok: false as const, error: "Already used" };
    if (new Date(inv.expires_at).getTime() < Date.now()) return { ok: false as const, error: "Expired" };
    if (inv.email && inv.email.toLowerCase() !== data.email.toLowerCase()) {
      return { ok: false as const, error: "This invitation is for a different email address" };
    }

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (cErr || !created.user) return { ok: false as const, error: cErr?.message ?? "Could not create account" };

    const { error: uErr } = await supabaseAdmin.from("app_users").insert({
      id: created.user.id,
      email: data.email,
      full_name: data.full_name,
      role: inv.role,
      school_id: inv.school_id,
      linked_student_id: inv.linked_student_id,
    });
    if (uErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return { ok: false as const, error: uErr.message };
    }

    await supabaseAdmin.from("school_invitations").update({ used_at: new Date().toISOString() }).eq("id", inv.id);
    return { ok: true as const, role: inv.role };
  });
