import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteOwnAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // Verify ownership via authenticated client first (will only succeed for self)
    const { data: me } = await supabase.from("app_users").select("id").eq("id", userId).maybeSingle();
    if (!me) throw new Error("Account not found");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Clean up rows that may not cascade
    await supabaseAdmin.from("teacher_assignments").delete().eq("user_id", userId);
    await supabaseAdmin.from("counselor_assignments").delete().eq("user_id", userId);
    await supabaseAdmin.from("notifications").delete().eq("to_user_id", userId);
    await supabaseAdmin.from("app_users").delete().eq("id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) { console.error("[server]", error); throw new Error("Account deletion failed. Please contact support."); }
    return { ok: true as const };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify caller is school_admin and target is in same school
    const { data: me } = await supabase.from("app_users").select("role,school_id").eq("id", userId).maybeSingle();
    if (!me || me.role !== "school_admin") throw new Error("Not authorized");
    if (data.user_id === userId) throw new Error("Use account self-deletion to remove your own account");
    const { data: target } = await supabase.from("app_users").select("id,school_id").eq("id", data.user_id).maybeSingle();
    if (!target || target.school_id !== me.school_id) throw new Error("User not in your school");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("teacher_assignments").delete().eq("user_id", data.user_id);
    await supabaseAdmin.from("counselor_assignments").delete().eq("user_id", data.user_id);
    await supabaseAdmin.from("notifications").delete().eq("to_user_id", data.user_id);
    await supabaseAdmin.from("app_users").delete().eq("id", data.user_id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) { console.error("[server]", error); throw new Error("User deletion failed. Please try again."); }
    return { ok: true as const };
  });
