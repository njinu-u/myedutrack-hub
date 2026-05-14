import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { AI_INSIGHTS, SUBJECT_HEATMAP, PROJECTIONS } from "@/lib/mock-data";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/analytics")({
  component: Analytics,
});

function heatColor(v: number) {
  if (v >= 85) return "bg-success/30 text-success";
  if (v >= 75) return "bg-success/15 text-success";
  if (v >= 65) return "bg-amber/15 text-amber";
  return "bg-danger/20 text-danger";
}

function Analytics() {
  return (
    <div className="space-y-6">
      <PageHead title="Analytics & AI Insights" subtitle="Predictive, causal, and explainable. The deepest view of how your school is actually doing." />

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
          <p className="text-xs text-muted-foreground">Predicted final outcomes per student</p>
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
