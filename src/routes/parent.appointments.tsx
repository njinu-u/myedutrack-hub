import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";

export const Route = createFileRoute("/parent/appointments")({ component: Appointments });

function Appointments() {
  return (
    <div className="space-y-6">
      <PageHead title="Book an appointment" subtitle="Reserve a parent-teacher conference slot." />
      <AIBlock title="Pre-meeting brief · tomorrow with Ms. Odhiambo" tone="info">
        Tomorrow you're meeting Ms. Odhiambo about Kofi. Three things worth discussing based on his recent data:
        <ol className="list-decimal pl-5 mt-2 space-y-1"><li>Math performance — focus on algebraic expressions</li><li>How Kofi is settling in socially</li><li>Plan for next term's assessments</li></ol>
      </AIBlock>
      <Card>
        <h2 className="font-display text-xl">Available slots this week</h2>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          {["Mon 14:00","Mon 15:30","Tue 09:00","Wed 16:00","Thu 13:30","Fri 10:00"].map((s) => (
            <button key={s} className="p-4 rounded-xl border hover:border-[oklch(0.7_0.13_35)] hover:bg-[oklch(0.7_0.13_35)]/5 transition text-left"><div className="font-display text-lg">{s}</div><div className="text-xs text-muted-foreground">Ms. Odhiambo · 20 min</div></button>
          ))}
        </div>
      </Card>
    </div>
  );
}
