import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { STUDENTS } from "@/lib/mock-data";
import { Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/teacher/grades")({ component: TeacherGrades });

function TeacherGrades() {
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success("Grades submitted for review");
  };
  return (
    <div className="space-y-6">
      <PageHead title="Grade entry · Math · 7B · Unit 4 Test" subtitle="Auto-saves as you type. Submit for review when complete." actions={
        <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex gap-2 items-center disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Submitting…" : "Submit for review"}
        </button>
      } />
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="text-xs uppercase tracking-wider text-muted-foreground border-b"><th className="text-left py-3">Student</th><th className="text-center">Score / 100</th><th className="text-center">Notes</th></tr></thead>
          <tbody>
            {STUDENTS.filter(s => s.classGroup === "7B").map((s) => {
              const g = s.subjects.find(x => x.name === "Math")?.grade ?? 0;
              return (
                <tr key={s.id} className="border-b hover:bg-secondary/40">
                  <td className="py-3 flex items-center gap-2.5"><img src={s.photo} className="h-8 w-8 rounded-full" alt="" />{s.name}</td>
                  <td className="text-center"><input defaultValue={g} className={cn("w-16 text-center py-1.5 rounded-md font-medium border", g < 50 ? "border-danger/40 text-danger bg-danger/5" : g < 70 ? "border-amber/40 text-amber bg-amber/5" : "border-success/30 text-success bg-success/5")} /></td>
                  <td className="text-center"><input placeholder="Optional note" className="w-48 px-3 py-1.5 rounded-md border bg-background text-xs" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <AIBlock title="Instant feedback" tone="warn">Class average: 48%. 2 students below 50%. Weakest concept: algebraic expressions (Question 3 — 30% correct). Suggested: 20-min re-teach before next lesson + targeted practice for Diego, Kofi.</AIBlock>
    </div>
  );
}
