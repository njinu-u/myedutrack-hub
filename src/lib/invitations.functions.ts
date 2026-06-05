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
      .select("id,code,token,role,email,name,linked_student_id,expires_at,used_at,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { invitations: data ?? [] };
  });

export const createInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      role: ROLE,
      name: z.string().trim().min(1).max(120),
      email: z.string().email(),
      linked_student_id: z.string().uuid().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase
      .from("app_users")
      .select("school_id,role,full_name")
      .eq("id", userId)
      .maybeSingle();
    if (!me?.school_id || me.role !== "school_admin") throw new Error("Forbidden");

    const { data: school } = await supabase.from("schools").select("name").eq("id", me.school_id).maybeSingle();
    const code = genCode();
    const { data: row, error } = await supabase
      .from("school_invitations")
      .insert({
        school_id: me.school_id,
        role: data.role,
        email: data.email,
        name: data.name,
        linked_student_id: data.linked_student_id ?? null,
        code,
        status: "pending",
      })
      .select("id,code,token,role,email,name,linked_student_id,expires_at,used_at,status,created_at")
      .single();
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }

    return {
      invitation: row,
      admin_name: me.full_name ?? "Your school admin",
      school_name: school?.name ?? "your school",
    };
  });

export const resendInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase.from("app_users").select("school_id,role,full_name").eq("id", userId).maybeSingle();
    if (!me?.school_id || me.role !== "school_admin") throw new Error("Forbidden");

    // Extend expiry another 7 days so the link stays valid
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: row, error } = await supabase
      .from("school_invitations")
      .update({ expires_at: newExpiry, status: "pending" })
      .eq("id", data.id)
      .eq("school_id", me.school_id)
      .select("id,code,token,role,email,name,linked_student_id,expires_at,used_at,status,created_at")
      .single();
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }

    const { data: school } = await supabase.from("schools").select("name").eq("id", me.school_id).maybeSingle();
    return { invitation: row, admin_name: me.full_name ?? "Your school admin", school_name: school?.name ?? "your school" };
  });

export const cancelInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase.from("app_users").select("school_id,role").eq("id", userId).maybeSingle();
    if (!me?.school_id || me.role !== "school_admin") throw new Error("Forbidden");

    const { error } = await supabase
      .from("school_invitations")
      .delete()
      .eq("id", data.id)
      .eq("school_id", me.school_id)
      .is("used_at", null);
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { ok: true as const };
  });

// ---------- Public (no auth) endpoints used by /accept-invite and /join/$code ----------

export const lookupInvitation = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: z.string().trim().min(4).max(32) }).parse(d))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from("school_invitations")
      .select("id,role,email,name,linked_student_id,expires_at,used_at,school_id")
      .eq("code", data.code.toUpperCase())
      .maybeSingle();
    if (!row) return { ok: false as const, error: "Invalid code" };
    if (row.used_at) return { ok: false as const, error: "This invitation has already been used" };
    if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false as const, error: "This invitation has expired" };
    const { data: school } = await supabaseAdmin.from("schools").select("name").eq("id", row.school_id).maybeSingle();
    return { ok: true as const, invitation: { role: row.role, email: row.email, name: row.name, school_name: school?.name ?? "your school" } };
  });

export const lookupInvitationByToken = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().trim().min(10).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from("school_invitations")
      .select("id,role,email,name,linked_student_id,expires_at,used_at,school_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!row) return { ok: false as const, error: "This invite link is invalid. Please contact your school admin." };
    if (row.used_at) return { ok: false as const, error: "This invite link has already been used. Please sign in instead." };
    if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false as const, error: "This invite link has expired. Please contact your school admin." };
    const { data: school } = await supabaseAdmin.from("schools").select("name").eq("id", row.school_id).maybeSingle();
    return {
      ok: true as const,
      invitation: {
        role: row.role,
        email: row.email,
        name: row.name,
        school_name: school?.name ?? "your school",
      },
    };
  });

export const redeemInvitation = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      code: z.string().trim().min(4).max(32),
      email: z.string().email(),
      password: z.string().min(8).max(72),
      full_name: z.string().trim().min(1).max(120),
    }).parse(d),
  )
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
    if (cErr || !created.user) { console.error("[server]", cErr); return { ok: false as const, error: "Could not create account. Please try again." }; }

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
      { console.error("[server]", uErr); return { ok: false as const, error: "Could not complete signup. Please try again." }; }
    }

    await supabaseAdmin
      .from("school_invitations")
      .update({ used_at: new Date().toISOString(), status: "accepted" })
      .eq("id", inv.id);
    return { ok: true as const, role: inv.role };
  });

export const redeemInvitationByToken = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      token: z.string().trim().min(10).max(64),
      password: z.string().min(8).max(72),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { data: inv } = await supabaseAdmin
      .from("school_invitations")
      .select("id,role,email,name,linked_student_id,expires_at,used_at,school_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!inv) return { ok: false as const, error: "Invalid invite link" };
    if (inv.used_at) return { ok: false as const, error: "This invite link has already been used" };
    if (new Date(inv.expires_at).getTime() < Date.now()) return { ok: false as const, error: "This invite link has expired" };
    if (!inv.email) return { ok: false as const, error: "This invitation is missing an email address" };

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: inv.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: inv.name ?? inv.email },
    });
    if (cErr || !created.user) { console.error("[server]", cErr); return { ok: false as const, error: "Could not create account. Please try again." }; }

    const { error: uErr } = await supabaseAdmin.from("app_users").insert({
      id: created.user.id,
      email: inv.email,
      full_name: inv.name ?? inv.email,
      role: inv.role,
      school_id: inv.school_id,
      linked_student_id: inv.linked_student_id,
    });
    if (uErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      { console.error("[server]", uErr); return { ok: false as const, error: "Could not complete signup. Please try again." }; }
    }

    await supabaseAdmin
      .from("school_invitations")
      .update({ used_at: new Date().toISOString(), status: "accepted" })
      .eq("id", inv.id);

    return { ok: true as const, role: inv.role, email: inv.email };
  });
