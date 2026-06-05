import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const bookAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      teacher_user_id: z.string().uuid(),
      student_id: z.string().uuid(),
      scheduled_at: z.string().datetime(),
      notes: z.string().max(1000).optional().nullable(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: appUser } = await supabase
      .from("app_users")
      .select("school_id,role,linked_student_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (!appUser?.school_id) throw new Error("No school linked to your account. Please contact your school admin.");
    if (appUser.role !== "parent") throw new Error("Only parents can book appointments.");
    if (!appUser.linked_student_id || appUser.linked_student_id !== data.student_id) {
      throw new Error("You may only book appointments for your own child.");
    }
    // Verify teacher belongs to the same school
    const { data: teacher } = await supabase
      .from("app_users")
      .select("id,role,school_id")
      .eq("id", data.teacher_user_id)
      .maybeSingle();
    if (!teacher || teacher.school_id !== appUser.school_id || (teacher.role !== "teacher" && teacher.role !== "counselor" && teacher.role !== "school_admin")) {
      throw new Error("Selected teacher is not available for your school.");
    }
    const { error } = await supabase.from("appointments").insert({
      teacher_user_id: data.teacher_user_id,
      student_id: data.student_id,
      scheduled_at: data.scheduled_at,
      notes: data.notes ?? null,
      school_id: appUser.school_id,
      parent_user_id: context.userId,
    });
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { ok: true };
  });

export const submitMoodCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      mood: z.number().int().min(1).max(5),
      note: z.string().max(500).optional().nullable(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: appUser } = await supabase.from("app_users").select("school_id,linked_student_id").eq("id", context.userId).maybeSingle();
    if (!appUser?.school_id || !appUser.linked_student_id) throw new Error("No linked student");
    const { error } = await supabase.from("mood_checkins").insert({
      mood: data.mood,
      note: data.note ?? null,
      school_id: appUser.school_id,
      student_id: appUser.linked_student_id,
    });
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { ok: true };
  });
