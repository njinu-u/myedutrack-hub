import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { KOFI } from "@/lib/mock-data";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";

export const Route = createFileRoute("/parent/grades")({ component: Page });

function Page() {
  const auth = useAuth();
  return auth.isAuthed ? <LiveParentGrades /> : <DemoParentGrades />;
}

function LiveParentGrades() {
  const auth = useAuth();
  useRealtimeInvalidate(["grades"], [["parent-grades"]]);
  const sid = auth.appUser?.linked_student_id;
  const q = useQuery({
    queryKey: ["parent-grades", sid],
    enabled: !!sid,
    queryFn: async () => {
      const { data } = await supabase.from("grades").select("subject,score,max_score,entered_at").eq("student_id", sid!).order("entered_at", { ascending: true });
      return data ?? [];
    },
  });

  if (!sid) {
    return (
      <div className="space-y-6">
        <PageHead title="Grades & reports" />
        <Card className="text-center py-14">
          <GraduationCap className="h-7 w-7 mx-auto text-teal" />
          <div className="font-display text-xl mt-3">No child linked yet</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Ask your school admin to link your account to your child's profile to see their grades.</p>
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
      <PageHead title="Grades & reports" subtitle="Your child's latest results — friendly summaries, no jargon." />
      {q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {!q.isLoading && rows.length === 0 && (
        <Card className="text-center py-14">
          <GraduationCap className="h-7 w-7 mx-auto text-teal" />
          <div className="font-display text-xl mt-3">No grades posted yet</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">As soon as your child's teachers post grades, you'll see them here with plain-language summaries.</p>
        </Card>
      )}
      {rows.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {rows.map((s) => {
            const trend = s.recent.length >= 2 ? (s.recent[s.recent.length - 1] - s.recent[0]) : 0;
            return (
              <Card key={s.name}>
                <div className="flex items-center justify-between">
                  <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{s.name}</div><div className="font-display text-3xl mt-1">{s.grade}%</div></div>
                  <div className={`text-xs px-2 py-1 rounded-full ${trend > 3 ? "bg-success/15 text-success" : trend < -3 ? "bg-danger/15 text-danger" : "bg-secondary text-muted-foreground"}`}>{trend > 3 ? "↑ Improving" : trend < -3 ? "↓ Needs support" : "→ Steady"}</div>
                </div>
                <div className="h-16 mt-3">
                  <ResponsiveContainer>
                    <LineChart data={s.recent.map((v, i) => ({ x: i, v }))}>
                      <Line type="monotone" dataKey="v" stroke="var(--color-teal)" strokeWidth={2.5} dot={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DemoParentGrades() {
  return (
    <div className="space-y-6">
      <PageHead title="Kofi's grades & reports" subtitle="Friendly summaries · Demo data" />
      <AIBlock title="What this term means" tone="info">
        Kofi's strongest subjects are Science (84%) and Art (88%) — both improving steadily. Math is the area to focus on; his teacher has prepared extra resources.
      </AIBlock>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {KOFI.subjects.map((s) => (
          <Card key={s.name}>
            <div className="flex items-center justify-between">
              <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{s.name}</div><div className="font-display text-3xl mt-1">{s.grade}%</div></div>
              <div className={`text-xs px-2 py-1 rounded-full ${s.trend === "up" ? "bg-success/15 text-success" : s.trend === "down" ? "bg-danger/15 text-danger" : "bg-secondary text-muted-foreground"}`}>{s.trend === "up" ? "↑ Improving" : s.trend === "down" ? "↓ Needs support" : "→ Steady"}</div>
            </div>
            <div className="h-16 mt-3">
              <ResponsiveContainer>
                <LineChart data={s.recent.map((v, i) => ({ x: i, v }))}>
                  <Line type="monotone" dataKey="v" stroke="var(--color-teal)" strokeWidth={2.5} dot={false} />
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
