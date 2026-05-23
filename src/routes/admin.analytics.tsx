import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHead, Stat } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { AI_INSIGHTS, SUBJECT_HEATMAP, PROJECTIONS } from "@/lib/mock-data";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Sparkles, BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";

export const Route = createFileRoute("/admin/analytics")({ component: Analytics });

function Analytics() {
  const auth = useAuth();
  return auth.isAuthed ? <LiveAnalytics /> : <DemoAnalytics />;
}

function heatColor(v: number) {
  if (v >= 85) return "bg-success/30 text-success";
  if (v >= 75) return "bg-success/15 text-success";
  if (v >= 65) return "bg-amber/15 text-amber";
  return "bg-danger/20 text-danger";
}

function LiveAnalytics() {
  useRealtimeInvalidate(["grades", "counselor_flags", "attendance"], [["admin-analytics"]]);
  const q = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [{ data: grades }, { data: flags }, { data: att }] = await Promise.all([
        supabase.from("grades").select("subject,score,max_score,term"),
        supabase.from("counselor_flags").select("severity,resolved_at,created_at,reason").order("created_at", { ascending: false }).limit(20),
        supabase.from("attendance").select("status,date").gte("date", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
      ]);
      return { grades: grades ?? [], flags: flags ?? [], att: att ?? [] };
    },
  });

  return (
    <div className="space-y-6">
      <PageHead title="Analytics & Insights" subtitle="Live performance, attendance and wellbeing signals from your school." />
      {q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {!q.isLoading && q.data && q.data.grades.length === 0 && q.data.att.length === 0 && q.data.flags.length === 0 && (
        <Card className="text-center py-14">
          <BarChart3 className="h-7 w-7 mx-auto text-teal" />
          <div className="font-display text-xl mt-3">No data yet</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Analytics activate as your teachers enter grades, mark attendance, and counselors log flags. Invite staff to get started.</p>
        </Card>
      )}
      {!q.isLoading && q.data && (q.data.grades.length > 0 || q.data.att.length > 0 || q.data.flags.length > 0) && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
            <Stat label="Grades recorded" value={q.data.grades.length} />
            <Stat label="Attendance (30d)" value={q.data.att.length ? `${Math.round(q.data.att.filter(a => a.status === "present").length / q.data.att.length * 100)}%` : "—"} />
            <Stat label="Active flags" value={q.data.flags.filter(f => !f.resolved_at).length} tone={q.data.flags.some(f => !f.resolved_at) ? "warn" : "default"} />
            <Stat label="Resolved flags" value={q.data.flags.filter(f => f.resolved_at).length} tone="good" />
          </div>
          {q.data.grades.length > 0 && (
            <Card>
              <h2 className="font-display text-xl">Average score by subject</h2>
              <SubjectAverages grades={q.data.grades} />
            </Card>
          )}
          {q.data.flags.length > 0 && (
            <Card>
              <h2 className="font-display text-xl flex items-center gap-2"><Sparkles className="h-4 w-4 text-teal" />Recent counselor flags</h2>
              <ul className="mt-4 space-y-2">
                {q.data.flags.slice(0, 6).map((f, i) => (
                  <li key={i} className="p-3 rounded-xl border flex items-start gap-3">
                    <span className={`h-2 w-2 rounded-full mt-2 ${f.severity === "high" ? "bg-danger" : f.severity === "medium" ? "bg-amber" : "bg-teal"}`} />
                    <div className="flex-1 min-w-0"><div className="text-sm">{f.reason}</div><div className="text-[11px] text-muted-foreground">{new Date(f.created_at).toLocaleString()}{f.resolved_at ? " · resolved" : ""}</div></div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function SubjectAverages({ grades }: { grades: Array<{ subject: string; score: number; max_score: number }> }) {
  const map = new Map<string, { t: number; n: number }>();
  for (const g of grades) {
    const k = g.subject;
    const e = map.get(k) ?? { t: 0, n: 0 };
    e.t += (g.score / g.max_score) * 100;
    e.n += 1;
    map.set(k, e);
  }
  const rows = [...map.entries()].map(([subject, v]) => ({ subject, avg: Math.round(v.t / v.n) })).sort((a, b) => b.avg - a.avg);
  return (
    <ul className="mt-3 space-y-2">
      {rows.map((r) => (
        <li key={r.subject} className="flex items-center justify-between p-3 rounded-xl border">
          <div className="font-medium text-sm">{r.subject}</div>
          <div className={cn("px-3 py-1 rounded-full text-sm font-medium", heatColor(r.avg))}>{r.avg}%</div>
        </li>
      ))}
    </ul>
  );
}

function DemoAnalytics() {
  return (
    <div className="space-y-6">
      <PageHead title="Analytics & AI Insights" subtitle="Predictive, causal, and explainable · Demo data" />
      <AIBlock title="Causal analysis: Grade 7 attendance dip" tone="warn">
        <div className="space-y-2">
          <p>Attendance in Grade 7 dropped from 94% → 88% over 8 weeks. Three correlated drivers identified:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Bus route 4 changed 3 weeks ago — affects 18 students whose attendance dropped 11%</li>
            <li>Term 2 exam anxiety period beginning — historical pattern repeats</li>
            <li>2 substitute teachers in 7B and 7C — engagement scores down 14%</li>
          </ol>
          <p className="text-xs text-muted-foreground">Confidence: 0.81 · Method: time-series correlation + observation-tag analysis</p>
        </div>
      </AIBlock>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Subject performance heatmap</h2>
            <span className="text-xs text-muted-foreground">Subject × Grade · current term</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs uppercase text-muted-foreground"><th className="text-left py-2"></th><th className="py-2">G6</th><th>G7</th><th>G8</th><th>G9</th><th>G10</th></tr></thead>
              <tbody>
                {SUBJECT_HEATMAP.map((r) => (
                  <tr key={r.subject} className="border-t">
                    <td className="py-2 font-medium">{r.subject}</td>
                    {(["g6","g7","g8","g9","g10"] as const).map((k) => (
                      <td key={k} className="py-2 text-center"><span className={cn("inline-flex w-12 h-8 items-center justify-center rounded-md font-medium", heatColor(r[k]))}>{r[k]}</span></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-xl">End-of-term projection</h2>
          <div className="h-72 mt-4">
            <ResponsiveContainer>
              <BarChart data={PROJECTIONS} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {PROJECTIONS.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <div className="flex items-center gap-2 mb-4"><Sparkles className="h-4 w-4 text-teal" /><h2 className="font-display text-xl">All AI insights</h2></div>
        <ul className="space-y-3">
          {AI_INSIGHTS.map((a, i) => {
            const c = a.level === "critical" ? "danger" : a.level === "warn" ? "amber" : a.level === "good" ? "success" : "teal";
            return (
              <li key={i} className="flex gap-3 p-4 rounded-xl border hover:border-teal transition">
                <span className="h-2 w-2 rounded-full mt-2 shrink-0" style={{ background: `var(--color-${c})` }} />
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{a.body}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">{a.time}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
