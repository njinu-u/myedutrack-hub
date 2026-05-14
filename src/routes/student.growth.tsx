import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { Award } from "lucide-react";

export const Route = createFileRoute("/student/growth")({ component: Growth });

const radar = [
  { axis: "Academic", v: 78 },{ axis: "Creative", v: 88 },{ axis: "Social", v: 82 },
  { axis: "Physical", v: 90 },{ axis: "Leadership", v: 72 },
];

const milestones = [
  { d: "Sep 2024", t: "Joined EduTrack 🎉" },
  { d: "Nov 2024", t: "First A in Science" },
  { d: "Jan 2025", t: "Perfect attendance week" },
  { d: "Mar 2025", t: "Teacher highlight: 'great question in class'" },
  { d: "May 2025", t: "Personal best in Art (88%)" },
];

function Growth() {
  return (
    <div className="space-y-6">
      <PageHead title="My growth" subtitle="Since you joined EduTrack — every milestone, every step forward." />
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <h2 className="font-display text-xl">Your strengths</h2>
          <div className="h-72 mt-4"><ResponsiveContainer><RadarChart data={radar}><PolarGrid /><PolarAngleAxis dataKey="axis" fontSize={11} /><Radar dataKey="v" stroke="var(--color-teal)" fill="var(--color-teal)" fillOpacity={0.3} /></RadarChart></ResponsiveContainer></div>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Talent spotter badge</h2>
          <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-amber/20 to-amber/5 border border-amber/30">
            <Award className="h-8 w-8 text-amber" />
            <div className="font-display text-xl mt-3">Leadership emerging</div>
            <p className="text-sm text-muted-foreground mt-1">Your teachers have noted collaborative behaviour in 4 separate observations. Keep building this — it's a real strength.</p>
          </div>
        </Card>
      </div>
      <Card>
        <h2 className="font-display text-xl">Your timeline</h2>
        <ol className="mt-5 relative border-l-2 border-border ml-3 space-y-5 pl-6">
          {milestones.map((m) => (
            <li key={m.t} className="relative"><span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-teal ring-4 ring-background" /><div className="text-xs uppercase tracking-wider text-muted-foreground">{m.d}</div><div className="font-medium mt-0.5">{m.t}</div></li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
