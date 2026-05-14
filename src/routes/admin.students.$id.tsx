import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { getStudent } from "@/lib/mock-data";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { ArrowLeft, MessageSquare, FileText } from "lucide-react";

export const Route = createFileRoute("/admin/students/$id")({
  component: StudentDetail,
});

function StudentDetail() {
  const { id } = useParams({ from: "/admin/students/$id" });
  const s = getStudent(id);
  return (
    <div className="space-y-6">
      <Link to="/admin/students" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" />All students</Link>

      <Card className="flex flex-wrap items-center gap-6">
        <img src={s.photo} alt="" className="h-24 w-24 rounded-2xl object-cover" />
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.grade} · {s.classGroup}</div>
          <h1 className="font-display text-3xl mt-1">{s.name}</h1>
          <div className="text-sm text-muted-foreground mt-1">{s.nationality} · joined {s.joined} · Parent: {s.parent} ({s.parentLang})</div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-full bg-secondary text-sm inline-flex gap-2"><MessageSquare className="h-4 w-4" />Message parent</button>
          <button className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex gap-2"><FileText className="h-4 w-4" />Generate report</button>
        </div>
      </Card>

      {s.flags.length > 0 && (
        <AIBlock title="AI deep analysis" tone={s.status === "Critical" ? "critical" : "warn"}>
          {s.name}'s profile shows {s.flags.length} signal{s.flags.length>1?"s":""} requiring attention: <span className="font-medium">{s.flags.join(", ")}</span>. Causal correlation with recent attendance pattern and observation notes is high (0.78). Recommended: counselor session within 5 days, parent communication using prepared template, peer-mentor pairing.
        </AIBlock>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {s.subjects.map((sub) => (
          <Card key={sub.name}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{sub.name}</div>
                <div className="font-display text-3xl mt-1">{sub.grade}<span className="text-sm text-muted-foreground">/100</span></div>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${sub.trend === "up" ? "bg-success/15 text-success" : sub.trend === "down" ? "bg-danger/15 text-danger" : "bg-secondary text-muted-foreground"}`}>
                {sub.trend === "up" ? "↑ improving" : sub.trend === "down" ? "↓ declining" : "→ stable"}
              </div>
            </div>
            <div className="h-20 mt-3">
              <ResponsiveContainer>
                <LineChart data={sub.recent.map((r, i) => ({ a: i, v: r }))}>
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
