import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AppRole = "school_admin" | "teacher" | "counselor" | "parent" | "student" | "super_admin";

export const listSchoolUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: me, error: meError } = await context.supabase
      .from("app_users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (meError) throw new Error(meError.message);
    if (!me) return { users: [] };

    const allowedRoles: AppRole[] = me.role === "parent"
      ? ["school_admin", "teacher", "counselor"]
      : me.role === "school_admin" || me.role === "teacher" || me.role === "counselor"
        ? ["school_admin", "teacher", "counselor", "parent", "student"]
        : [];
    if (allowedRoles.length === 0) return { users: [] };

    const { data, error } = await context.supabase
      .from("app_users")
      .select("id,full_name,email,role")
      .in("role", allowedRoles)
      .order("full_name", { ascending: true });
    if (error) throw new Error(error.message);
    return { users: (data ?? []).filter((u) => u.id !== context.userId) };
  });

export const listThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ counterpart_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const me = context.userId;
    const other = data.counterpart_id;
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id,from_user_id,to_user_id,body,subject,sent_at,read_at")
      .or(`and(from_user_id.eq.${me},to_user_id.eq.${other}),and(from_user_id.eq.${other},to_user_id.eq.${me})`)
      .order("sent_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { messages: rows ?? [] };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      to_user_id: z.string().uuid(),
      body: z.string().trim().min(1).max(4000),
      subject: z.string().trim().max(200).optional().nullable(),
    }).parse(i)
  )
  .handler(async ({ data, context }) => {
    const { data: u } = await context.supabase.from("app_users").select("school_id").eq("id", context.userId).maybeSingle();
    if (!u?.school_id) throw new Error("No school linked to your account. Please contact your school admin.");
    const { data: recipient, error: recipientError } = await context.supabase
      .from("app_users")
      .select("id")
      .eq("id", data.to_user_id)
      .maybeSingle();
    if (recipientError) throw new Error(recipientError.message);
    if (!recipient) throw new Error("This recipient is not available for your school account.");
    const { error } = await context.supabase.from("messages").insert({
      from_user_id: context.userId,
      to_user_id: data.to_user_id,
      body: data.body,
      subject: data.subject ?? null,
      school_id: u.school_id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
