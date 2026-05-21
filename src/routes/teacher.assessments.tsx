import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Loader2, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/teacher/assessments")({
  head: () => ({ meta: [{ title: "Assessments — EduTrack" }] }),
  component: Page,
});

type Grade = { id: string; subject: string; score: number; max_score: number; term: string | null; entered_at: string; student_id: string };

function Page() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  useRealtimeInvalidate(["grades"], [["teacher-assessments"]]);

  const q = useQuery({
    queryKey: ["teacher-assessments"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("id,subject,score,max_score,term,entered_at,student_id")
        .eq("entered_by", auth.user!.id)
        .order("entered_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return (data ?? []) as Grade[];
    },
  });

  const rows = q.data ?? [];
  const groups = new Map<string, Grade[]>();
  for (const r of rows) {
    const k = `${r.subject} · ${r.term ?? "Untermed"}`;
    const arr = groups.get(k) ?? [];
    arr.push(r);
    groups.set(k, arr);
  }

  return (
    <div className="space-y-6">
      <PageHead title="My Assessments" subtitle="Every grade you've entered, grouped by subject and term." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in to view your assessments.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && !q.isLoading && rows.length === 0 && (
        <Card className="text-center py-10">
          <ClipboardList className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No assessments yet. Enter grades from <span className="font-medium">Teacher → Grades</span>.</p>
        </Card>
      )}
      {isReal && groups.size > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {[...groups.entries()].map(([k, rs]) => {
            const avg = Math.round(rs.reduce((a, r) => a + (r.score / r.max_score) * 100, 0) / rs.length);
            const students = new Set(rs.map((r) => r.student_id)).size;
            return (
              <Card key={k}>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="font-display text-3xl mt-1">{avg}%</div>
                <div className="text-xs text-muted-foreground mt-1">{rs.length} entries · {students} students · last {new Date(rs[0].entered_at).toLocaleDateString()}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
