import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { KOFI } from "@/lib/mock-data";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";

export const Route = createFileRoute("/student/grades")({ component: Page });

function Page() {
  const auth = useAuth();
  return auth.isAuthed ? <LiveStudentGrades /> : <DemoStudentGrades />;
}

function LiveStudentGrades() {
  const auth = useAuth();
  useRealtimeInvalidate(["grades"], [["student-grades"]]);
  const sid = auth.appUser?.linked_student_id;
  const q = useQuery({
    queryKey: ["student-grades", sid],
    enabled: !!sid,
    queryFn: async () => {
      const { data } = await supabase.from("grades").select("subject,score,max_score,entered_at").eq("student_id", sid!).order("entered_at", { ascending: true });
      return data ?? [];
    },
  });

  if (!sid) {
    return (
      <div className="space-y-6">
        <PageHead title="My grades" />
        <Card className="text-center py-14">
          <BookOpen className="h-7 w-7 mx-auto text-teal" />
          <div className="font-display text-xl mt-3">Account not linked yet</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Your school admin will link you to your student profile soon. Then your grades will appear here.</p>
        </Card>
      </div>
    );
  }

  const grades = q.data ?? [];
  const bySubject = new Map<string, { score: number; max: number; recent: number[] }>();
  for (const g of grades) {
    const e = bySubject.get(g.subject) ?? { score: 0, max: 0, recent: [] };
    e.score += g.score;
    e.max += g.max_score;
    e.recent.push(Math.round((g.score / g.max_score) * 100));
    bySubject.set(g.subject, e);
  }
  const rows = [...bySubject.entries()].map(([name, v]) => ({ name, grade: Math.round((v.score / v.max) * 100), recent: v.recent }));

  return (
    <div className="space-y-6">
      <PageHead title="My grades" subtitle="See how you're doing — and what to focus on." />
      {q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {!q.isLoading && rows.length === 0 && (
        <Card className="text-center py-14">
          <BookOpen className="h-7 w-7 mx-auto text-teal" />
          <div className="font-display text-xl mt-3">No grades yet</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Your teachers will start posting grades soon. They'll appear here automatically.</p>
        </Card>
      )}
      {rows.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {rows.map((s) => (
            <Card key={s.name}>
              <div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-wider text-muted-foreground">{s.name}</div><div className="font-display text-3xl mt-1">{s.grade}%</div></div></div>
              <div className="h-16 mt-3">
                <ResponsiveContainer>
                  <LineChart data={s.recent.map((v, i) => ({ x: i, v }))}>
                    <Line type="monotone" dataKey="v" stroke="var(--color-teal)" strokeWidth={2.5} dot />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DemoStudentGrades() {
  return (
    <div className="space-y-6">
      <PageHead title="My grades" subtitle="See how you're doing · Demo data" />
      <AIBlock title="Your grade coach" tone="info">In Math, you're doing better at geometry than algebra. Your last test showed equations are the tricky part. Spend 20 minutes tonight on the practice sheet — small, steady wins.</AIBlock>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {KOFI.subjects.map((s) => (
          <Card key={s.name}>
            <div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-wider text-muted-foreground">{s.name}</div><div className="font-display text-3xl mt-1">{s.grade}%</div></div></div>
            <div className="h-16 mt-3">
              <ResponsiveContainer>
                <LineChart data={s.recent.map((v, i) => ({ x: i, v }))}>
                  <Line type="monotone" dataKey="v" stroke="var(--color-teal)" strokeWidth={2.5} dot />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
