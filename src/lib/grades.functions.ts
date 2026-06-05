import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listGradesForClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      class_id: z.string().min(1).max(50).nullable(),
      grade: z.string().min(1).max(50).nullable(),
      subject: z.string().min(1).max(100),
      term: z.string().min(1).max(50),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase.from("students").select("id,full_name,photo_url,class_id,grade").order("full_name");
    if (data.class_id) q = q.eq("class_id", data.class_id);
    else if (data.grade) q = q.eq("grade", data.grade);
    const [{ data: students, error: sErr }, { data: grades, error: gErr }] = await Promise.all([
      q,
      supabase.from("grades").select("id,student_id,score,max_score,entered_at")
        .eq("subject", data.subject).eq("term", data.term).order("entered_at", { ascending: false }),
    ]);
    if (sErr) throw new Error(sErr.message);
    if (gErr) throw new Error(gErr.message);
    const latest = new Map<string, { score: number; max_score: number }>();
    for (const g of grades ?? []) {
      if (!latest.has(g.student_id)) latest.set(g.student_id, { score: g.score, max_score: g.max_score });
    }
    return {
      rows: (students ?? []).map((s) => ({
        student_id: s.id,
        full_name: s.full_name,
        photo_url: s.photo_url,
        class_id: s.class_id,
        grade: s.grade,
        score: latest.get(s.id)?.score ?? null,
        max_score: latest.get(s.id)?.max_score ?? 100,
      })),
    };
  });

export const upsertGrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      student_id: z.string().uuid(),
      subject: z.string().min(1).max(100),
      term: z.string().min(1).max(50),
      score: z.number().int().min(0).max(1000),
      max_score: z.number().int().min(1).max(1000).default(100),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: u } = await supabase.from("app_users").select("school_id").eq("id", userId).maybeSingle();
    if (!u?.school_id) throw new Error("No school linked to your account. Please contact your school admin.");
    const { error: dErr } = await supabase.from("grades").delete()
      .eq("student_id", data.student_id).eq("subject", data.subject).eq("term", data.term);
    if (dErr) throw new Error(dErr.message);
    const { error } = await supabase.from("grades").insert({
      student_id: data.student_id,
      subject: data.subject,
      term: data.term,
      score: data.score,
      max_score: data.max_score,
      school_id: u.school_id,
      entered_by: userId,
    });
    if (error) { console.error("[server]", error); throw new Error("Request failed. Please try again."); }
    return { ok: true };
  });
