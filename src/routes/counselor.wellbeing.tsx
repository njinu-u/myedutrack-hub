import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/counselor/wellbeing")({ component: Wellbeing });

const grid = [
  [4,4,3,3,4,5,4,4],
  [3,3,2,3,3,4,4,3],
  [4,5,5,4,5,5,4,4],
  [2,2,1,2,2,3,2,1],
  [3,3,3,4,4,4,3,3],
];
const moodColor = (v: number) => v >= 4 ? "bg-success/30" : v === 3 ? "bg-amber/20" : v === 2 ? "bg-amber/40" : "bg-danger/40";

function Wellbeing() {
  return (
    <div className="space-y-6">
      <PageHead title="Wellbeing monitor" subtitle="Mood pulse across grades and weeks. Spot patterns before they become problems." />
      <AIBlock title="Wellbeing narrative · Kofi Mensah" tone="warn">Kofi's mood has trended negatively for 3 weeks, correlating with his math grade decline and a family relocation period. No acute crisis indicators, but early supportive contact recommended this week.</AIBlock>
      <Card>
        <h2 className="font-display text-xl">Mood heatmap · 8 weeks × grades</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="text-xs">
            <thead><tr className="text-muted-foreground"><th></th>{Array.from({length:8}).map((_,i)=><th key={i} className="px-3">W{i+1}</th>)}</tr></thead>
            <tbody>
              {["Grade 6","Grade 7","Grade 8","Grade 9","Grade 10"].map((g, ri) => (
                <tr key={g}><td className="pr-3 py-1.5 font-medium">{g}</td>{grid[ri].map((v, i) => (
                  <td key={i} className="p-1"><div className={cn("h-9 w-12 rounded-md grid place-items-center font-medium", moodColor(v))}>{v}.0</div></td>
                ))}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex gap-3 text-xs text-muted-foreground"><span>1 — distressed</span><span>3 — neutral</span><span>5 — thriving</span></div>
      </Card>
    </div>
  );
}
