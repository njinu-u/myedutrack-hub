import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";

export const Route = createFileRoute("/counselor/risk")({ component: Risk });

function Risk() {
  return (
    <div className="space-y-6">
      <PageHead title="AI Risk Reports" subtitle="Causal chains, predictive outcomes, and ranked intervention recommendations." />
      <AIBlock title="Diego Alvarez · full causal chain" tone="critical">
        <div className="space-y-2">
          <p>Sequence of contributing factors (most recent first):</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Family relocation announcement (8 weeks ago) → mood drop from 4 → 2</li>
            <li>Disengagement from after-school activities (6 weeks ago)</li>
            <li>Math substitute teacher rotation (5 weeks) → grade slide 55 → 38</li>
            <li>Friendship conflict logged in observation tag (3 weeks ago)</li>
            <li>Attendance pattern: Mondays + Fridays missed (last 4 weeks)</li>
          </ol>
        </div>
      </AIBlock>
      <Card>
        <h2 className="font-display text-xl">Predicted outcomes (90 days, no intervention)</h2>
        <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
          {[{l:"Attendance",v:"54%",c:"danger"},{l:"Math grade",v:"32%",c:"danger"},{l:"Disengagement risk",v:"82%",c:"danger"}].map((p) => (
            <div key={p.l} className="p-4 rounded-xl border"><div className="text-xs text-muted-foreground">{p.l}</div><div className={`font-display text-3xl mt-1 text-${p.c}`}>{p.v}</div></div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-xl">Recommended interventions · ranked</h2>
        <ol className="mt-4 space-y-2">
          {[
            { t: "Family liaison call within 5 days", i: "+34% recovery probability" },
            { t: "Peer mentor pairing (8 weeks)", i: "+22% engagement" },
            { t: "Reduced assessment pressure window (4 weeks)", i: "+18% mood" },
            { t: "Twice-weekly counselor check-in", i: "+15% attendance" },
          ].map((r, i) => (
            <li key={i} className="flex items-center gap-3 p-3 rounded-xl border">
              <div className="h-7 w-7 grid place-items-center rounded-full bg-[oklch(0.65_0.13_320)] text-white text-xs font-semibold">{i+1}</div>
              <div className="flex-1"><div className="font-medium text-sm">{r.t}</div><div className="text-xs text-success">{r.i}</div></div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
