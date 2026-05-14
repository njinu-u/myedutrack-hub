import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";

export const Route = createFileRoute("/student/goals")({ component: Goals });

function Goals() {
  return (
    <div className="space-y-6">
      <PageHead title="My goals" subtitle="Set goals that stretch you. Track them weekly." />
      <Card>
        <div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-wider text-teal">Active goal</div><h3 className="font-display text-2xl mt-1">Get above 70% in Math by end of term</h3></div><div className="text-right"><div className="text-xs text-muted-foreground">Progress</div><div className="font-display text-2xl">58 → 70%</div></div></div>
        <div className="mt-4 h-3 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-gradient-to-r from-teal to-success" style={{ width: "58%" }} /></div>
        <div className="text-xs text-muted-foreground mt-2">12 points to go · 6 weeks remaining</div>
      </Card>
      <AIBlock title="Goal coach" tone="info">You're at 58% — 12 points from your goal. At your current improvement rate, you'll need to score 76% on your next two assessments. Focus on equations — that's where the gap is widest. You can do this.</AIBlock>
      <Card>
        <h3 className="font-display text-xl">Past goals</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center justify-between p-3 rounded-xl border"><span>Improve English essay scores</span><span className="text-xs px-2 py-1 rounded-full bg-success/15 text-success">Achieved</span></li>
          <li className="flex items-center justify-between p-3 rounded-xl border"><span>Make 3 new friends in Grade 7</span><span className="text-xs px-2 py-1 rounded-full bg-success/15 text-success">Achieved</span></li>
        </ul>
      </Card>
    </div>
  );
}
