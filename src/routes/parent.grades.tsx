import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { KOFI } from "@/lib/mock-data";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/parent/grades")({ component: ParentGrades });

function ParentGrades() {
  return (
    <div className="space-y-6">
      <PageHead title="Kofi's grades & reports" subtitle="Friendly summaries — no spreadsheets, no jargon." />
      <AIBlock title="What this term means" tone="info">
        Kofi's strongest subjects are Science (84%) and Art (88%) — both improving steadily. Math is the area to focus on; his teacher has prepared extra resources. Overall he's <span className="font-medium">on track</span> and settling well into Grade 7.
      </AIBlock>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {KOFI.subjects.map((s) => (
          <Card key={s.name}>
            <div className="flex items-center justify-between">
              <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{s.name}</div><div className="font-display text-3xl mt-1">{s.grade}%</div></div>
              <div className={`text-xs px-2 py-1 rounded-full ${s.trend === "up" ? "bg-success/15 text-success" : s.trend === "down" ? "bg-danger/15 text-danger" : "bg-secondary text-muted-foreground"}`}>{s.trend === "up" ? "↑ Improving" : s.trend === "down" ? "↓ Needs support" : "→ Steady"}</div>
            </div>
            <div className="h-16 mt-3"><ResponsiveContainer><LineChart data={s.recent.map((v,i)=>({x:i,v}))}><Line type="monotone" dataKey="v" stroke="var(--color-teal)" strokeWidth={2.5} dot={false}/><Tooltip contentStyle={{borderRadius:12,fontSize:11}}/></LineChart></ResponsiveContainer></div>
            <div className="text-xs text-muted-foreground mt-2">vs class avg: <span className="font-medium text-foreground">{s.grade > 75 ? "Above" : s.grade > 60 ? "Average" : "Below"}</span></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
