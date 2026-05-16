import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TAGS = ["Academic", "Social", "Behavioral", "Emotional", "Physical", "Language"] as const;

const CreateSchema = z.object({
  student_id: z.string().uuid(),
  subject: z.string().trim().min(1).max(80).optional().nullable(),
  note: z.string().trim().min(3).max(4000),
  tags: z.array(z.enum(TAGS)).max(6).default([]),
});

export const listObservations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { student_id?: string }) => d ?? {})
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("observations")
      .select("id,student_id,subject,note,tags,ai_suggestions,created_at,teacher_id")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.student_id) q = q.eq("student_id", data.student_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { observations: rows ?? [] };
  });

export const listMyStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("students")
      .select("id,full_name,grade,class_id")
      .order("full_name", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    return { students: data ?? [] };
  });

export const createObservation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: school } = await supabase.from("app_users").select("school_id").eq("id", userId).maybeSingle();
    if (!school?.school_id) throw new Error("User has no school");

    // Pull recent context for the student
    const [{ data: recentGrades }, { data: recentObs }, { data: recentMood }] = await Promise.all([
      supabase.from("grades").select("subject,score,max_score,entered_at").eq("student_id", data.student_id).order("entered_at", { ascending: false }).limit(6),
      supabase.from("observations").select("note,tags,created_at").eq("student_id", data.student_id).order("created_at", { ascending: false }).limit(3),
      supabase.from("mood_checkins").select("mood,checked_at").eq("student_id", data.student_id).order("checked_at", { ascending: false }).limit(5),
    ]);

    // Call Lovable AI Gateway for next-step suggestions
    let ai_suggestions: string | null = null;
    try {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (apiKey) {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are an expert classroom coach. Given a teacher's observation plus recent grades, prior observations, and mood data, output 2–3 concrete, actionable next steps the teacher can take this week. Use short bullet lines (start each with '- '). No preamble." },
              { role: "user", content: JSON.stringify({
                new_observation: { subject: data.subject, note: data.note, tags: data.tags },
                recent_grades: recentGrades ?? [],
                prior_observations: recentObs ?? [],
                recent_mood: recentMood ?? [],
              }) },
            ],
          }),
        });
        if (resp.ok) {
          const j = await resp.json() as { choices?: { message?: { content?: string } }[] };
          ai_suggestions = j.choices?.[0]?.message?.content?.trim() ?? null;
        } else if (resp.status === 429) {
          ai_suggestions = "AI suggestions temporarily unavailable (rate limit). Try again shortly.";
        } else if (resp.status === 402) {
          ai_suggestions = "AI suggestions paused — workspace credits exhausted.";
        }
      }
    } catch (e) {
      console.error("AI suggestions failed", e);
    }

    const { data: row, error } = await supabase
      .from("observations")
      .insert({
        school_id: school.school_id,
        student_id: data.student_id,
        teacher_id: userId,
        subject: data.subject ?? null,
        note: data.note,
        tags: data.tags,
        ai_suggestions,
      })
      .select("id,student_id,subject,note,tags,ai_suggestions,created_at,teacher_id")
      .single();
    if (error) throw new Error(error.message);
    return { observation: row };
  });
