import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen } from "lucide-react";

export const Route = createFileRoute("/admin/curriculum")({
  head: () => ({ meta: [{ title: "Curriculum — EduTrack" }] }),
  component: Page,
});

function Page() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;

  const q = useQuery({
    queryKey: ["curriculum-overview"],
    enabled: isReal,
    queryFn: async () => {
      const [{ data: grades }, { data: students }] = await Promise.all([
        supabase.from("grades").select("subject,score,max_score,term,student_id"),
        supabase.from("students").select("id,grade"),
      ]);
      const subjects = new Map<string, { total: number; count: number; students: Set<string>; terms: Set<string> }>();
      for (const g of grades ?? []) {
        const k = g.subject;
        const o = subjects.get(k) ?? { total: 0, count: 0, students: new Set(), terms: new Set() };
        o.total += (g.score / g.max_score) * 100;
        o.count += 1;
        o.students.add(g.student_id);
        if (g.term) o.terms.add(g.term);
        subjects.set(k, o);
      }
      const gradeLevels = new Map<string, number>();
      for (const s of students ?? []) {
        const k = s.grade ?? "Ungrouped";
        gradeLevels.set(k, (gradeLevels.get(k) ?? 0) + 1);
      }
      return { subjects, gradeLevels, studentCount: students?.length ?? 0 };
    },
  });

  return (
    <div className="space-y-6">
      <PageHead title="Curriculum" subtitle="Subjects taught, terms covered, and student coverage across grade levels." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in to view your curriculum overview.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && q.data && q.data.subjects.size === 0 && (
        <Card className="text-center py-10">
          <BookOpen className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No subjects yet. Add grades from Teacher → Grades to populate the curriculum view.</p>
        </Card>
      )}
      {isReal && q.data && q.data.subjects.size > 0 && (
        <>
          <Card>
            <h2 className="font-display text-xl">Subjects</h2>
            <table className="w-full text-sm mt-4">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                <tr><th className="text-left py-2">Subject</th><th>Avg</th><th>Students</th><th>Terms</th></tr>
              </thead>
              <tbody>
                {[...q.data.subjects.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([s, o]) => (
                  <tr key={s} className="border-b last:border-0">
                    <td className="py-2 font-medium">{s}</td>
                    <td className="text-center">{Math.round(o.total / o.count)}%</td>
                    <td className="text-center">{o.students.size}</td>
                    <td className="text-center text-muted-foreground">{[...o.terms].join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card>
            <h2 className="font-display text-xl">Grade-level coverage</h2>
            <div className="mt-3 grid sm:grid-cols-3 gap-3">
              {[...q.data.gradeLevels.entries()].sort().map(([g, n]) => (
                <div key={g} className="rounded-xl border p-3"><div className="text-xs text-muted-foreground">{g}</div><div className="font-display text-2xl">{n}</div><div className="text-xs text-muted-foreground">students</div></div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
