import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { KOFI } from "@/lib/mock-data";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/student/grades")({ component: StudentGrades });

function StudentGrades() {
  return (
    <div className="space-y-6">
      <PageHead title="My grades" subtitle="See how you're doing — and what to focus on." />
      <AIBlock title="Your grade coach" tone="info">In Math, you're doing better at geometry than algebra. Your last test showed equations are the tricky part. Spend 20 minutes tonight on the practice sheet — small, steady wins.</AIBlock>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {KOFI.subjects.map((s) => (
          <Card key={s.name}>
            <div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-wider text-muted-foreground">{s.name}</div><div className="font-display text-3xl mt-1">{s.grade}%</div></div></div>
            <div className="h-16 mt-3"><ResponsiveContainer><LineChart data={s.recent.map((v,i)=>({x:i,v}))}><Line type="monotone" dataKey="v" stroke="var(--color-teal)" strokeWidth={2.5} dot/><Tooltip contentStyle={{borderRadius:12,fontSize:11}}/></LineChart></ResponsiveContainer></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
