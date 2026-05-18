import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { STUDENTS } from "@/lib/mock-data";
import { Lock, Save, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/grades")({
  component: Grades,
});

function colorFor(g: number) {
  if (g >= 80) return "bg-success/15 text-success";
  if (g >= 65) return "bg-amber/10 text-amber";
  return "bg-danger/15 text-danger";
}

function Grades() {
  const subjects = ["Math","English","Science","History","Art","PE"];
  return (
    <div className="space-y-6">
      <PageHead title="Grade Management" subtitle="Central filing system: every grade, every student, every assessment. Locked, audited, AI-anomaly-checked." actions={
        <>
          <button className="px-4 py-2 rounded-full text-sm bg-secondary inline-flex gap-2 items-center"><Upload className="h-4 w-4" />Import CSV</button>
          <button className="px-4 py-2 rounded-full text-sm bg-amber text-navy inline-flex gap-2 items-center"><Lock className="h-4 w-4" />Lock period</button>
          <button className="px-4 py-2 rounded-full text-sm bg-navy text-white inline-flex gap-2 items-center"><Save className="h-4 w-4" />Save changes</button>
        </>
      } />

      <AIBlock title="Anomaly detected: Amara Okeke · Math Unit 4" tone="warn">
        Score of 94% is a 41-point jump from her previous 4-week average (53%). This outlier warrants review. The class as a whole also scored unusually high (avg 78% vs typical 64%) — possible marking inconsistency. <span className="underline">Open audit trail →</span>
      </AIBlock>

      <Card>
        <div className="flex flex-wrap gap-2">
          {["By Class · 7B","By Subject","By Student","By Assessment"].map((t, i) => (
            <button key={t} className={cn("px-4 py-2 rounded-full text-sm", i === 0 ? "bg-navy text-white" : "bg-secondary hover:bg-secondary/80")}>{t}</button>
          ))}
          <div className="ml-auto text-xs text-muted-foreground">Weighted: Exams 50% · Coursework 30% · Participation 20%</div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left py-3 sticky left-0 bg-card">Student</th>
                {subjects.map((s) => <th key={s} className="text-center py-3 font-medium px-2">{s}</th>)}
                <th className="text-center py-3 font-medium">Final</th>
              </tr>
            </thead>
            <tbody>
              {STUDENTS.filter(s => s.classGroup === "7B" || s.classGroup === "8A").map((st) => {
                const final = Math.round(st.subjects.reduce((a, b) => a + b.grade, 0) / st.subjects.length);
                return (
                  <tr key={st.id} className="border-t hover:bg-secondary/40">
                    <td className="py-3 sticky left-0 bg-card font-medium flex items-center gap-2.5"><img src={st.photo} className="h-7 w-7 rounded-full" alt="" />{st.name}</td>
                    {subjects.map((sub) => {
                      const g = st.subjects.find(x => x.name === sub)?.grade;
                      return (
                        <td key={sub} className="text-center px-2 py-2">
                          {g != null ? (
                            <span className={cn("inline-flex items-center justify-center w-12 h-8 rounded-md font-medium text-sm", colorFor(g))}>{g}</span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                      );
                    })}
                    <td className="text-center font-display text-lg">{final}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
