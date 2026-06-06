import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ChatMessage = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(4000),
});

export const askTeacherAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      messages: z.array(ChatMessage).min(1).max(20),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { reply: "AI is not configured yet. Please contact your administrator.", error: true as const };
    }

    // Pull live context: school students, recent grades, observations, mood
    const { data: me } = await supabase
      .from("app_users")
      .select("school_id,full_name,role")
      .eq("id", userId)
      .maybeSingle();

    let context_summary: Record<string, unknown> = {};
    if (me?.school_id) {
      const [{ data: students }, { data: grades }, { data: observations }, { data: mood }, { data: attendance }] = await Promise.all([
        supabase.from("students").select("id,full_name,grade,class_id").eq("school_id", me.school_id).limit(50),
        supabase.from("grades").select("student_id,subject,score,max_score,entered_at").eq("school_id", me.school_id).order("entered_at", { ascending: false }).limit(40),
        supabase.from("observations").select("student_id,subject,note,tags,created_at").eq("school_id", me.school_id).order("created_at", { ascending: false }).limit(20),
        supabase.from("mood_checkins").select("student_id,mood,checked_at").eq("school_id", me.school_id).order("checked_at", { ascending: false }).limit(40),
        supabase.from("attendance").select("student_id,status,date").eq("school_id", me.school_id).order("date", { ascending: false }).limit(80),
      ]);
      context_summary = {
        teacher: me.full_name,
        students_count: students?.length ?? 0,
        students: students ?? [],
        recent_grades: grades ?? [],
        recent_observations: observations ?? [],
        recent_mood: mood ?? [],
        recent_attendance: attendance ?? [],
      };
    }

    const system = `You are an AI teaching assistant for ${me?.full_name ?? "the teacher"}. You have access to their live school data (students, grades, observations, mood check-ins, attendance) provided in the first system context message. Answer concisely with specific, actionable insights. Reference real student names and numbers from the data. If the data is empty, say so and suggest what to record first. Use short paragraphs and bullets.`;

    const apiMessages = [
      { role: "system", content: system },
      { role: "system", content: `LIVE SCHOOL DATA (JSON):\n${JSON.stringify(context_summary).slice(0, 12000)}` },
      ...data.messages.map((m) => ({ role: m.role, content: m.text })),
    ];

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: apiMessages }),
      });
      if (resp.status === 429) return { reply: "Rate limit reached. Please retry in a moment.", error: true as const };
      if (resp.status === 402) return { reply: "AI credits exhausted. Please top up workspace credits.", error: true as const };
      if (!resp.ok) {
        console.error("[server] AI gateway error", resp.status, await resp.text().catch(() => ""));
        return { reply: "AI service unavailable. Please try again.", error: true as const };
      }
      const j = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
      const reply = j.choices?.[0]?.message?.content?.trim() ?? "(no response)";
      return { reply, error: false as const };
    } catch (e) {
      console.error("[server] AI fetch failed", e);
      return { reply: "AI service unreachable. Please try again.", error: true as const };
    }
  });
