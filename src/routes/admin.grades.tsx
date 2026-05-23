import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { STUDENTS } from "@/lib/mock-data";
import { Lock, Save, Upload, GraduationCap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";

export const Route = createFileRoute("/admin/grades")({ component: Page });

function Page() {
  const auth = useAuth();
  return auth.isAuthed ? <LiveGrades /> : <DemoGrades />;
}

function colorFor(g: number) {
  if (g >= 80) return "bg-success/15 text-success";
  if (g >= 65) return "bg-amber/10 text-amber";
  return "bg-danger/15 text-danger";
}

function LiveGrades() {
  useRealtimeInvalidate(["grades"], [["admin-grades"]]);
  const q = useQuery({
    queryKey: ["admin-grades"],
    queryFn: async () => {
      const [{ data: students }, { data: grades }] = await Promise.all([
        supabase.from("students").select("id,full_name,grade,class_id").order("full_name"),
        supabase.from("grades").select("student_id,subject,score,max_score,term,entered_at").order("entered_at", { ascending: false }),
      ]);
      return { students: students ?? [], grades: grades ?? [] };
    },
  });

  return (
    <div className="space-y-6">
      <PageHead title="Grade Management" subtitle="Live grade book aggregated from your teachers." />
      {q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {!q.isLoading && q.data && q.data.students.length === 0 && (
        <Card className="text-center py-14">
          <GraduationCap className="h-7 w-7 mx-auto text-teal" />
          <div className="font-display text-xl mt-3">No students yet</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Add students to your roster, then grades will appear here as teachers enter them.</p>
          <Link to="/admin/students" className="inline-block mt-4 px-4 py-2 rounded-full bg-navy text-white text-sm">Manage students</Link>
        </Card>
      )}
      {!q.isLoading && q.data && q.data.students.length > 0 && q.data.grades.length === 0 && (
        <Card className="text-center py-14">
          <GraduationCap className="h-7 w-7 mx-auto text-teal" />
          <div className="font-display text-xl mt-3">No grades entered yet</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Teachers can record grades from the Teacher → Grades workspace. They'll appear here in real time.</p>
        </Card>
      )}
      {!q.isLoading && q.data && q.data.grades.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs uppercase tracking-wider text-muted-foreground border-b"><th className="text-left py-2">Student</th><th>Subjects</th><th>Average</th><th className="text-right">Last entry</th></tr></thead>
              <tbody>
                {q.data.students.map((s) => {
                  const sg = q.data!.grades.filter((g) => g.student_id === s.id);
                  if (sg.length === 0) return null;
                  const avg = Math.round(sg.reduce((a, g) => a + (g.score / g.max_score) * 100, 0) / sg.length);
                  const subjects = [...new Set(sg.map((g) => g.subject))];
                  const last = sg[0];
                  return (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{s.full_name}<div className="text-[11px] text-muted-foreground">{s.grade ?? ""} {s.class_id ?? ""}</div></td>
                      <td className="text-center text-xs text-muted-foreground">{subjects.join(" · ")}</td>
                      <td className="text-center"><span className={cn("inline-flex px-3 py-1 rounded-full text-sm font-medium", colorFor(avg))}>{avg}%</span></td>
                      <td className="text-right text-muted-foreground">{new Date(last.entered_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function DemoGrades() {
  const subjects = ["Math","English","Science","History","Art","PE"];
  return (
    <div className="space-y-6">
      <PageHead title="Grade Management" subtitle="Central filing system · Demo data" actions={
        <>
          <button onClick={() => toast.info("Demo mode")} className="px-4 py-2 rounded-full text-sm bg-secondary inline-flex gap-2 items-center"><Upload className="h-4 w-4" />Import CSV</button>
          <button onClick={() => toast.success("Demo period locked")} className="px-4 py-2 rounded-full text-sm bg-amber text-navy inline-flex gap-2 items-center"><Lock className="h-4 w-4" />Lock period</button>
          <button onClick={() => toast.success("Demo changes saved")} className="px-4 py-2 rounded-full text-sm bg-navy text-white inline-flex gap-2 items-center"><Save className="h-4 w-4" />Save changes</button>
        </>
      } />
      <AIBlock title="Anomaly detected: Amara Okeke · Math Unit 4" tone="warn">
        Score of 94% is a 41-point jump from her previous 4-week average (53%). This outlier warrants review.
      </AIBlock>
      <Card>
        <div className="overflow-x-auto">
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
                          {g != null ? <span className={cn("inline-flex items-center justify-center w-12 h-8 rounded-md font-medium text-sm", colorFor(g))}>{g}</span> : <span className="text-muted-foreground">—</span>}
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
