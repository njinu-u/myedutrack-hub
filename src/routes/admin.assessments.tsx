import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Loader2, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/admin/assessments")({
  head: () => ({ meta: [{ title: "Assessments — EduTrack" }] }),
  component: Page,
});

type Row = { id: string; subject: string; score: number; max_score: number; term: string | null; entered_at: string; student_id: string };

function Page() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  useRealtimeInvalidate(["grades"], [["admin-assessments"]]);

  const q = useQuery({
    queryKey: ["admin-assessments"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grades")
        .select("id,subject,score,max_score,term,entered_at,student_id")
        .order("entered_at", { ascending: false })
        .limit(1000);
      if (error) throw new Error(error.message);
      return (data ?? []) as Row[];
    },
  });

  const rows = q.data ?? [];
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const k = `${r.subject} · ${r.term ?? "Untermed"}`;
    const arr = groups.get(k) ?? [];
    arr.push(r);
    groups.set(k, arr);
  }

  return (
    <div className="space-y-6">
      <PageHead title="Assessments" subtitle="All grade entries grouped by subject and term." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in to view live assessment data.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && !q.isLoading && rows.length === 0 && (
        <Card className="text-center py-10">
          <ClipboardList className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No grades recorded yet. Teachers can enter grades from <span className="font-medium">Teacher → Grades</span>.</p>
        </Card>
      )}
      {isReal && groups.size > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {[...groups.entries()].map(([k, rs]) => {
            const avg = Math.round(rs.reduce((a, r) => a + (r.score / r.max_score) * 100, 0) / rs.length);
            return (
              <Card key={k}>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="font-display text-3xl mt-1">{avg}%</div>
                <div className="text-xs text-muted-foreground mt-1">{rs.length} grade {rs.length === 1 ? "entry" : "entries"} · last {new Date(rs[0].entered_at).toLocaleDateString()}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
