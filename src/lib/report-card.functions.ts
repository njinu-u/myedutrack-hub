import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReportCardData = {
  student: { id: string; full_name: string; grade: string | null; class_id: string | null; photo_url: string | null; email: string | null };
  school: { name: string | null };
  term: string;
  subjects: { subject: string; score: number; max_score: number; percent: number; entered_at: string }[];
  average: number | null;
  attendance: { present: number; absent: number; late: number; total: number; rate: number };
  observations: { id: string; note: string; created_at: string; subject: string | null }[];
  parents: { id: string; full_name: string | null; email: string }[];
};

export const getStudentReportCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      student_id: z.string().uuid(),
      term: z.string().min(1).max(50),
    }).parse(i),
  )
  .handler(async ({ data, context }): Promise<ReportCardData> => {
    const { supabase } = context;
    const { data: student, error: sErr } = await supabase
      .from("students")
      .select("id,full_name,grade,class_id,photo_url,email,school_id")
      .eq("id", data.student_id)
      .maybeSingle();
    if (sErr || !student) throw new Error("Student not found");

    const [{ data: school }, { data: grades }, { data: att }, { data: obs }, { data: parents }] = await Promise.all([
      supabase.from("schools").select("name").eq("id", student.school_id).maybeSingle(),
      supabase.from("grades").select("subject,score,max_score,entered_at,term").eq("student_id", data.student_id).eq("term", data.term).order("entered_at", { ascending: false }),
      supabase.from("attendance").select("status").eq("student_id", data.student_id),
      supabase.from("observations").select("id,note,created_at,subject").eq("student_id", data.student_id).order("created_at", { ascending: false }).limit(10),
      supabase.from("app_users").select("id,full_name,email,role,linked_student_id").eq("linked_student_id", data.student_id).eq("role", "parent"),
    ]);

    const latest = new Map<string, { score: number; max_score: number; entered_at: string }>();
    for (const g of grades ?? []) if (!latest.has(g.subject)) latest.set(g.subject, { score: g.score, max_score: g.max_score, entered_at: g.entered_at });
    const subjects = [...latest.entries()].map(([subject, g]) => ({
      subject,
      score: g.score,
      max_score: g.max_score,
      percent: Math.round((g.score / g.max_score) * 100),
      entered_at: g.entered_at,
    })).sort((a, b) => a.subject.localeCompare(b.subject));
    const average = subjects.length ? Math.round(subjects.reduce((a, s) => a + s.percent, 0) / subjects.length) : null;

    const aRows = att ?? [];
    const present = aRows.filter((a) => a.status === "present").length;
    const absent = aRows.filter((a) => a.status === "absent").length;
    const late = aRows.filter((a) => a.status === "late").length;
    const total = aRows.length;
    const rate = total ? Math.round((present / total) * 100) : 0;

    return {
      student: {
        id: student.id, full_name: student.full_name, grade: student.grade,
        class_id: student.class_id, photo_url: student.photo_url, email: student.email,
      },
      school: { name: school?.name ?? null },
      term: data.term,
      subjects,
      average,
      attendance: { present, absent, late, total, rate },
      observations: (obs ?? []).map((o) => ({ id: o.id, note: o.note, created_at: o.created_at, subject: o.subject })),
      parents: (parents ?? []).filter((p) => p.email).map((p) => ({ id: p.id, full_name: p.full_name, email: p.email })),
    };
  });

export const sendReportCardToParents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      student_id: z.string().uuid(),
      term: z.string().min(1).max(50),
      subject: z.string().min(1).max(200),
      body: z.string().min(1).max(10000),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase.from("app_users").select("school_id,full_name,email").eq("id", userId).maybeSingle();
    if (!me?.school_id) throw new Error("No school linked to your account.");
    const { data: parents, error: pErr } = await supabase
      .from("app_users")
      .select("id,email,full_name")
      .eq("linked_student_id", data.student_id)
      .eq("role", "parent");
    if (pErr) throw new Error(pErr.message);
    if (!parents || parents.length === 0) {
      return { sent: 0, recipients: [] as string[], reason: "no_parent_account" as const };
    }
    let sent = 0;
    const recipients: string[] = [];
    for (const p of parents) {
      const { data: ins, error } = await supabase.from("messages").insert({
        from_user_id: userId,
        to_user_id: p.id,
        body: data.body,
        subject: data.subject,
        school_id: me.school_id,
      }).select("id").maybeSingle();
      if (error) { console.error("[server] message insert", error); continue; }
      sent += 1;
      recipients.push(p.email);
      await supabase.from("notifications").insert({
        to_user_id: p.id,
        school_id: me.school_id,
        type: "report_card",
        message: data.subject,
        related_id: ins?.id ?? null,
        link: "/parent/messages",
      });
    }
    return { sent, recipients, reason: null as null };
  });
