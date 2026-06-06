import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TeacherInput = z.object({
  items: z.array(z.object({
    class_label: z.string().trim().min(1).max(80),
    subject: z.string().trim().min(1).max(80).nullable().optional(),
  })).max(200),
});

const CounselorInput = z.object({
  class_labels: z.array(z.string().trim().min(1).max(80)).max(200),
});

export const getMyTeacherAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("teacher_assignments")
      .select("id,class_label,subject")
      .eq("user_id", userId);
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { items: data ?? [] };
  });

export const saveMyTeacherAssignments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => TeacherInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: school } = await supabase.from("schools").select("id").maybeSingle();
    if (!school) throw new Error("No school found for current user");
    const del = await supabase.from("teacher_assignments").delete().eq("user_id", userId);
    if (del.error) { console.error("[server]", del.error); throw new Error("Request failed. Please try again."); }
    if (data.items.length > 0) {
      const rows = data.items.map((i) => ({
        user_id: userId, school_id: school.id, class_label: i.class_label, subject: i.subject ?? null,
      }));
      const ins = await supabase.from("teacher_assignments").insert(rows);
      if (ins.error) { console.error("[server]", ins.error); throw new Error("Request failed. Please try again."); }
    }
    return { ok: true as const };
  });

export const getMyCounselorAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("counselor_assignments")
      .select("id,class_label")
      .eq("user_id", userId);
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { items: data ?? [] };
  });

export const saveMyCounselorAssignments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CounselorInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: school } = await supabase.from("schools").select("id").maybeSingle();
    if (!school) throw new Error("No school found for current user");
    const del = await supabase.from("counselor_assignments").delete().eq("user_id", userId);
    if (del.error) { console.error("[server]", del.error); throw new Error("Request failed. Please try again."); }
    if (data.class_labels.length > 0) {
      const rows = data.class_labels.map((c) => ({ user_id: userId, school_id: school.id, class_label: c }));
      const ins = await supabase.from("counselor_assignments").insert(rows);
      if (ins.error) { console.error("[server]", ins.error); throw new Error("Request failed. Please try again."); }
    }
    return { ok: true as const };
  });
