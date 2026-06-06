import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export const PERIODS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"] as const;

export type TimetableSlot = {
  id: string;
  day: string;
  period: string;
  class_label: string;
  subject: string | null;
  teacher_user_id: string | null;
  teacher_name?: string | null;
  room: string | null;
  unassigned_reason: string | null;
};

async function getSchoolId(supabase: any): Promise<string> {
  const { data } = await supabase.from("app_users").select("school_id").maybeSingle();
  if (!data?.school_id) throw new Error("No school for current user");
  return data.school_id;
}

export const getTimetable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("timetable_slots")
      .select("id,day,period,class_label,subject,teacher_user_id,room,unassigned_reason");
    if (error) { console.error("[timetable]", error); throw new Error("Failed to load timetable"); }
    const slots = data ?? [];
    const teacherIds = Array.from(new Set(slots.map((s: any) => s.teacher_user_id).filter(Boolean)));
    let names: Record<string, string> = {};
    if (teacherIds.length > 0) {
      const { data: us } = await supabase
        .from("app_users").select("id,full_name").in("id", teacherIds);
      for (const u of us ?? []) names[u.id] = u.full_name ?? "";
    }
    const items: TimetableSlot[] = slots.map((s: any) => ({
      ...s, teacher_name: s.teacher_user_id ? names[s.teacher_user_id] ?? null : null,
    }));
    return { items };
  });

export const clearTimetable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const school_id = await getSchoolId(supabase);
    const { error } = await supabase.from("timetable_slots").delete().eq("school_id", school_id);
    if (error) { console.error("[timetable]", error); throw new Error("Failed to clear timetable"); }
    return { ok: true as const };
  });

export const generateTimetable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    days: z.array(z.string()).max(7).optional(),
    periods: z.array(z.string()).max(20).optional(),
  }).parse(i ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school_id = await getSchoolId(supabase);
    const days = data.days?.length ? data.days : [...DAYS];
    const periods = data.periods?.length ? data.periods : [...PERIODS];

    // Pull teacher assignments (class_label + subject + user_id)
    const { data: assigns, error: aerr } = await supabase
      .from("teacher_assignments")
      .select("user_id,class_label,subject")
      .eq("school_id", school_id);
    if (aerr) { console.error("[timetable]", aerr); throw new Error("Failed to load teacher assignments"); }

    if (!assigns || assigns.length === 0) {
      throw new Error("No teacher assignments found. Ask teachers to set their classes/subjects first.");
    }

    // Distinct classes & per-class subjects (from teacher assignments).
    const classSubjects = new Map<string, Set<string>>();
    // Map (class_label|subject) -> teacher candidate ids
    const candidates = new Map<string, string[]>();
    for (const a of assigns as any[]) {
      const cl = a.class_label as string;
      const sub = (a.subject ?? "General") as string;
      if (!classSubjects.has(cl)) classSubjects.set(cl, new Set());
      classSubjects.get(cl)!.add(sub);
      const k = `${cl}|${sub}`;
      const arr = candidates.get(k) ?? [];
      if (!arr.includes(a.user_id)) arr.push(a.user_id);
      candidates.set(k, arr);
    }

    const classes = Array.from(classSubjects.keys()).sort();
    const rows: any[] = [];
    const teacherLoad: Record<string, number> = {};
    // busy[day][period] = Set of teacher ids
    const busy: Record<string, Record<string, Set<string>>> = {};
    for (const d of days) { busy[d] = {}; for (const p of periods) busy[d][p] = new Set(); }

    // Round-robin subjects per class across slots
    for (const cl of classes) {
      const subs = Array.from(classSubjects.get(cl)!);
      let idx = 0;
      for (const d of days) {
        for (const p of periods) {
          const subject = subs[idx % subs.length];
          idx++;
          const key = `${cl}|${subject}`;
          const cands = candidates.get(key) ?? [];
          // pick least-loaded teacher not busy this slot
          const free = cands.filter((t) => !busy[d][p].has(t));
          let teacher: string | null = null;
          let reason: string | null = null;
          if (free.length === 0) {
            reason = cands.length === 0
              ? `No teacher teaches ${subject} for ${cl}`
              : `All ${subject} teachers busy at ${d} ${p}`;
          } else {
            free.sort((a, b) => (teacherLoad[a] ?? 0) - (teacherLoad[b] ?? 0));
            teacher = free[0];
            teacherLoad[teacher] = (teacherLoad[teacher] ?? 0) + 1;
            busy[d][p].add(teacher);
          }
          rows.push({
            school_id, day: d, period: p, class_label: cl,
            subject, teacher_user_id: teacher, room: null, unassigned_reason: reason,
          });
        }
      }
    }

    // Replace existing timetable
    const del = await supabase.from("timetable_slots").delete().eq("school_id", school_id);
    if (del.error) { console.error("[timetable]", del.error); throw new Error("Failed to reset timetable"); }
    if (rows.length > 0) {
      const ins = await supabase.from("timetable_slots").insert(rows);
      if (ins.error) { console.error("[timetable]", ins.error); throw new Error("Failed to save timetable"); }
    }

    const unassigned = rows.filter((r) => !r.teacher_user_id).length;
    return { ok: true as const, total: rows.length, unassigned, classes: classes.length };
  });
