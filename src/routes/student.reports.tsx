import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHead, Card, Stat } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Loader2, FileText } from "lucide-react";

export const Route = createFileRoute("/student/reports")({
  head: () => ({ meta: [{ title: "My Reports — EduTrack" }] }),
  component: Page,
});

function Page() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  useRealtimeInvalidate(["grades", "attendance"], [["student-reports"]]);

  const q = useQuery({
    queryKey: ["student-reports"],
    enabled: isReal,
    queryFn: async () => {
      const sid = auth.appUser?.linked_student_id;
      if (!sid) return null;
      const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
      const [{ data: grades }, { data: att }] = await Promise.all([
        supabase.from("grades").select("subject,score,max_score,term,entered_at").eq("student_id", sid).order("entered_at", { ascending: false }),
        supabase.from("attendance").select("status,date").eq("student_id", sid).gte("date", since),
      ]);
      return { grades: grades ?? [], att: att ?? [] };
    },
  });

  if (isReal && q.data === null) {
    return (
      <div className="space-y-6">
        <PageHead title="My Reports" />
        <Card className="text-center py-10">
          <FileText className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">Your account isn't linked to a student profile yet. Ask your school admin to link you.</p>
        </Card>
      </div>
    );
  }

  const grades = q.data?.grades ?? [];
  const att = q.data?.att ?? [];
  const avg = grades.length ? Math.round(grades.reduce((a, g) => a + (g.score / g.max_score) * 100, 0) / grades.length) : 0;
  const present = att.filter((a) => a.status === "present").length;
  const rate = att.length ? Math.round((present / att.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHead title="My Reports" subtitle="Your grades and attendance at a glance." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in to view your real report.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && q.data && grades.length === 0 && att.length === 0 && (
        <Card className="text-center py-10">
          <FileText className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No data yet — your teachers will populate grades and attendance as the term progresses.</p>
        </Card>
      )}
      {isReal && q.data && (grades.length > 0 || att.length > 0) && (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <Stat label="Overall average" value={avg ? `${avg}%` : "—"} tone={avg >= 70 ? "good" : avg >= 50 ? "warn" : "bad"} />
            <Stat label="Attendance (60d)" value={att.length ? `${rate}%` : "—"} />
            <Stat label="Grades recorded" value={grades.length} />
          </div>
          {grades.length > 0 && (
            <Card>
              <h2 className="font-display text-xl">Recent grades</h2>
              <table className="w-full text-sm mt-3">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                  <tr><th className="text-left py-2">Subject</th><th>Score</th><th>Term</th><th className="text-right">Date</th></tr>
                </thead>
                <tbody>
                  {grades.slice(0, 20).map((g, i) => {
                    const pct = Math.round((g.score / g.max_score) * 100);
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-medium">{g.subject}</td>
                        <td className="text-center">{g.score}/{g.max_score} <span className="text-muted-foreground">({pct}%)</span></td>
                        <td className="text-center text-muted-foreground">{g.term ?? "—"}</td>
                        <td className="text-right text-muted-foreground">{new Date(g.entered_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
