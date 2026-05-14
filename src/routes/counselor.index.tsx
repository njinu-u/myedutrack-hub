import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead, Stat } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { STUDENTS } from "@/lib/mock-data";

export const Route = createFileRoute("/counselor/")({ component: Dash });

function Dash() {
  const flagged = STUDENTS.filter(s => s.status === "Critical" || s.status === "At Risk" || s.flags.length > 0);
  return (
    <div className="space-y-6">
      <PageHead title="Wellbeing dashboard" subtitle="6 students under active support · 3 flagged this week" />
      <AIBlock title="Diego Alvarez · escalation recommended" tone="critical">Attendance 65%, mood 1/5 sustained 2 weeks, 4 subjects in decline. Causal chain suggests family transition stress + academic pressure spiral. Similar profiles respond best to peer mentor + reduced assessment pressure (4 wks) + family liaison call.</AIBlock>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <Stat label="Active interventions" value="11" />
        <Stat label="New flags · week" value="3" tone="warn" />
        <Stat label="Improvement rate" value="68%" change="post-intervention" tone="good" />
        <Stat label="Sessions this week" value="14" />
      </div>
      <Card>
        <h2 className="font-display text-xl">Students needing support</h2>
        <ul className="mt-4 space-y-2">
          {flagged.map((s) => (
            <li key={s.id} className="flex items-center gap-3 p-3 rounded-xl border hover:border-[oklch(0.65_0.13_320)] transition">
              <img src={s.photo} className="h-10 w-10 rounded-full object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{s.name} <span className="text-xs text-muted-foreground">· {s.grade}</span></div>
                <div className="text-xs text-muted-foreground">{s.flags.join(" · ") || "Monitoring"}</div>
              </div>
              <div className="text-2xl">{["😢","😟","😐","🙂","😊"][s.mood-1]}</div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${s.status === "Critical" ? "bg-danger/15 text-danger" : "bg-amber/15 text-amber"}`}>{s.status}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
