import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const StatusEnum = z.enum(["present", "absent", "late", "excused"]);

export const listAttendanceForDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(i))
  .handler(async ({ data, context }) => {
    const [{ data: students, error: sErr }, { data: rows, error: aErr }] = await Promise.all([
      context.supabase.from("students").select("id,full_name,grade,class_id,photo_url").order("full_name"),
      context.supabase.from("attendance").select("id,student_id,status,recorded_at").eq("date", data.date),
    ]);
    if (sErr) throw new Error(sErr.message);
    if (aErr) throw new Error(aErr.message);
    const map = new Map((rows ?? []).map((r) => [r.student_id, r]));
    return {
      rows: (students ?? []).map((s) => ({
        student_id: s.id,
        full_name: s.full_name,
        grade: s.grade,
        class_id: s.class_id,
        photo_url: s.photo_url,
        status: map.get(s.id)?.status ?? null,
      })),
    };
  });

export const markAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      student_id: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      status: StatusEnum,
    }).parse(i)
  )
  .handler(async ({ data, context }) => {
    const { data: u } = await context.supabase.from("app_users").select("school_id").maybeSingle();
    if (!u?.school_id) throw new Error("No school");
    // Delete any prior record for the same student+date, then insert. (No unique constraint.)
    const { error: dErr } = await context.supabase
      .from("attendance")
      .delete()
      .eq("student_id", data.student_id)
      .eq("date", data.date);
    if (dErr) throw new Error(dErr.message);
    const { error } = await context.supabase.from("attendance").insert({
      student_id: data.student_id,
      date: data.date,
      status: data.status,
      school_id: u.school_id,
      recorded_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
