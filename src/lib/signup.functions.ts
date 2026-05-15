import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  full_name: z.string().trim().min(1).max(120),
  school_name: z.string().trim().min(1).max(200),
  country: z.string().trim().min(1).max(80),
  student_count: z.number().int().min(1).max(20000),
});

export const signupSchoolAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => SignupSchema.parse(d))
  .handler(async ({ data }) => {
    // 1. Create auth user (auto-confirmed for smooth onboarding to free trial)
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (cErr || !created.user) {
      return { ok: false as const, error: cErr?.message ?? "Could not create account" };
    }
    const userId = created.user.id;

    // 2. Create school with 90-day trial
    const trialExpires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: school, error: sErr } = await supabaseAdmin
      .from("schools")
      .insert({
        name: data.school_name,
        admin_email: data.email,
        country: data.country,
        student_count: data.student_count,
        plan: "free_trial",
        status: "trial",
        trial_expires_at: trialExpires,
      })
      .select("id")
      .single();
    if (sErr || !school) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { ok: false as const, error: sErr?.message ?? "Could not create school" };
    }

    // 3. Link app_users row
    const { error: uErr } = await supabaseAdmin.from("app_users").insert({
      id: userId,
      email: data.email,
      full_name: data.full_name,
      role: "school_admin",
      school_id: school.id,
    });
    if (uErr) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { ok: false as const, error: uErr.message };
    }

    return { ok: true as const, school_id: school.id };
  });
