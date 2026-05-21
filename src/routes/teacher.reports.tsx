import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHead, Card, Stat } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/teacher/reports")({
  head: () => ({ meta: [{ title: "Reports — EduTrack" }] }),
  component: Page,
});

function Page() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;

  const q = useQuery({
    queryKey: ["teacher-reports"],
    enabled: isReal,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const [{ data: grades }, { data: att }, { data: obs }] = await Promise.all([
        supabase.from("grades").select("subject,score,max_score").eq("entered_by", auth.user!.id),
        supabase.from("attendance").select("status,date").eq("recorded_by", auth.user!.id).gte("date", since),
        supabase.from("observations").select("id").eq("teacher_id", auth.user!.id),
      ]);
      return { grades: grades ?? [], att: att ?? [], obs: obs ?? [] };
    },
  });

  const grades = q.data?.grades ?? [];
  const att = q.data?.att ?? [];
  const obs = q.data?.obs ?? [];
  const avg = grades.length ? Math.round(grades.reduce((a, g) => a + (g.score / g.max_score) * 100, 0) / grades.length) : 0;
  const present = att.filter((a) => a.status === "present").length;
  const rate = att.length ? Math.round((present / att.length) * 100) : 0;
  const bySubject = new Map<string, { total: number; n: number }>();
  for (const g of grades) {
    const o = bySubject.get(g.subject) ?? { total: 0, n: 0 };
    o.total += (g.score / g.max_score) * 100; o.n++;
    bySubject.set(g.subject, o);
  }

  return (
    <div className="space-y-6">
      <PageHead title="My Reports" subtitle="Snapshot of grades you've entered, attendance you've taken, and observations you've logged." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in to view your reports.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && q.data && grades.length === 0 && att.length === 0 && obs.length === 0 && (
        <Card className="text-center py-10">
          <BarChart3 className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No data yet. Once you enter grades, take attendance or log observations, summaries appear here.</p>
        </Card>
      )}
      {isReal && q.data && (grades.length > 0 || att.length > 0 || obs.length > 0) && (
        <>
          <div className="grid sm:grid-cols-4 gap-3">
            <Stat label="Grades entered" value={grades.length} />
            <Stat label="Class avg" value={avg ? `${avg}%` : "—"} tone={avg >= 70 ? "good" : avg >= 50 ? "warn" : "bad"} />
            <Stat label="Attendance rate (30d)" value={att.length ? `${rate}%` : "—"} />
            <Stat label="Observations" value={obs.length} />
          </div>
          {bySubject.size > 0 && (
            <Card>
              <h2 className="font-display text-xl">Average by subject</h2>
              <ul className="mt-3 space-y-2">
                {[...bySubject.entries()].map(([s, o]) => {
                  const a = Math.round(o.total / o.n);
                  return (
                    <li key={s} className="flex items-center gap-3">
                      <span className="w-32 text-sm font-medium">{s}</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-teal" style={{ width: `${a}%` }} /></div>
                      <span className="text-sm w-12 text-right">{a}%</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
