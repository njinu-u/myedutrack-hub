import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Loader2, Users } from "lucide-react";

export const Route = createFileRoute("/counselor/students")({
  head: () => ({ meta: [{ title: "My Students — EduTrack" }] }),
  component: Page,
});

type Student = { id: string; full_name: string; grade: string | null; class_id: string | null };
type Flag = { student_id: string; severity: "low" | "medium" | "high"; resolved_at: string | null; created_at: string };

function Page() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  useRealtimeInvalidate(["counselor_flags", "mood_checkins"], [["counselor-caseload"]]);

  const q = useQuery({
    queryKey: ["counselor-caseload"],
    enabled: isReal,
    queryFn: async () => {
      const [{ data: students }, { data: flags }, { data: moods }] = await Promise.all([
        supabase.from("students").select("id,full_name,grade,class_id").order("full_name"),
        supabase.from("counselor_flags").select("student_id,severity,resolved_at,created_at"),
        supabase.from("mood_checkins").select("student_id,mood,checked_at").order("checked_at", { ascending: false }).limit(500),
      ]);
      return { students: (students ?? []) as Student[], flags: (flags ?? []) as Flag[], moods: moods ?? [] };
    },
  });

  return (
    <div className="space-y-6">
      <PageHead title="My Students" subtitle="Caseload sorted by risk — active flags, severity, recent mood." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in to view your caseload.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && q.data && q.data.students.length === 0 && (
        <Card className="text-center py-10">
          <Users className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No students enrolled yet. Ask your admin to add students from Admin → Students.</p>
        </Card>
      )}
      {isReal && q.data && q.data.students.length > 0 && (
        <Card>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
              <tr><th className="text-left py-2">Student</th><th>Grade</th><th>Active flags</th><th>Last mood</th></tr>
            </thead>
            <tbody>
              {q.data.students.map((s) => {
                const active = q.data!.flags.filter((f) => f.student_id === s.id && !f.resolved_at);
                const mood = q.data!.moods.find((m) => m.student_id === s.id);
                const risk = active.some((f) => f.severity === "high") ? 3 : active.some((f) => f.severity === "medium") ? 2 : active.length > 0 ? 1 : 0;
                return { s, active, mood, risk };
              }).sort((a, b) => b.risk - a.risk).map(({ s, active, mood }) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{s.full_name}</td>
                  <td className="text-center text-muted-foreground">{s.grade ?? "—"}</td>
                  <td className="text-center">{active.length > 0 ? <span className="px-2 py-0.5 rounded-full bg-amber/15 text-amber text-xs">{active.length}</span> : <span className="text-muted-foreground">0</span>}</td>
                  <td className="text-center">{mood ? `${mood.mood}/5` : <span className="text-muted-foreground">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
