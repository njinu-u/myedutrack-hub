import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHead, Card, Stat } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { downloadPdf } from "@/lib/export";
import { Loader2, FileText, Download, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/student/reports")({
  head: () => ({ meta: [{ title: "My Reports — EduTrack" }] }),
  component: Page,
});

function Page() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  const [term, setTerm] = useState<string>("all");
  const [busy, setBusy] = useState<null | "pdf" | "share">(null);
  useRealtimeInvalidate(["grades", "attendance"], [["student-reports"]]);

  const q = useQuery({
    queryKey: ["student-reports"],
    enabled: isReal,
    queryFn: async () => {
      const sid = auth.appUser?.linked_student_id;
      if (!sid) return null;
      const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
      const [{ data: grades }, { data: att }, { data: student }] = await Promise.all([
        supabase.from("grades").select("subject,score,max_score,term,entered_at").eq("student_id", sid).order("entered_at", { ascending: false }),
        supabase.from("attendance").select("status,date").eq("student_id", sid).gte("date", since),
        supabase.from("students").select("full_name,grade,class_id").eq("id", sid).maybeSingle(),
      ]);
      return { grades: grades ?? [], att: att ?? [], student };
    },
  });

  const terms = useMemo(() => {
    const set = new Set<string>();
    for (const g of q.data?.grades ?? []) if (g.term) set.add(g.term);
    return [...set].sort();
  }, [q.data]);

  const filteredGrades = useMemo(() => {
    const all = q.data?.grades ?? [];
    return term === "all" ? all : all.filter((g) => g.term === term);
  }, [q.data, term]);

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

  const att = q.data?.att ?? [];
  const avg = filteredGrades.length ? Math.round(filteredGrades.reduce((a, g) => a + (g.score / g.max_score) * 100, 0) / filteredGrades.length) : 0;
  const present = att.filter((a) => a.status === "present").length;
  const rate = att.length ? Math.round((present / att.length) * 100) : 0;
  const name = q.data?.student?.full_name ?? "Student";
  const reportTitle = `${name} · ${term === "all" ? "All terms" : term} Report`;

  const exportPdf = async () => {
    setBusy("pdf");
    try {
      downloadPdf(`${name.replace(/\s+/g, "-").toLowerCase()}-${term}`, reportTitle, [
        { type: "heading", text: "Summary" },
        { type: "paragraph", text: `Overall average: ${avg}%. Attendance (60d): ${rate}% across ${att.length} days. Grades recorded: ${filteredGrades.length}.` },
        { type: "heading", text: "Grades" },
        filteredGrades.length
          ? { type: "table", head: ["Subject", "Score", "Max", "Percent", "Term", "Date"],
              body: filteredGrades.map((g) => [g.subject, g.score, g.max_score, `${Math.round((g.score/g.max_score)*100)}%`, g.term ?? "—", new Date(g.entered_at).toLocaleDateString()]) }
          : { type: "paragraph", text: "No grades recorded for this term yet." },
      ]);
      toast.success("PDF downloaded");
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  };

  const share = async () => {
    setBusy("share");
    try {
      const text = `${reportTitle}\nOverall average: ${avg}%\nAttendance (60d): ${rate}%\nGrades recorded: ${filteredGrades.length}`;
      const navAny = navigator as Navigator & { share?: (d: { title: string; text: string }) => Promise<void> };
      if (navAny.share) {
        await navAny.share({ title: reportTitle, text });
        toast.success("Shared");
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Report summary copied to clipboard");
      }
    } catch (e) { if ((e as Error).name !== "AbortError") toast.error((e as Error).message); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="My Reports"
        subtitle="Your grades and attendance — download or share."
        actions={isReal && q.data ? (
          <div className="flex gap-2 flex-wrap">
            <select value={term} onChange={(e) => setTerm(e.target.value)} className="px-3 h-9 rounded-full border bg-card text-sm">
              <option value="all">All terms</option>
              {terms.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={exportPdf} disabled={busy !== null || filteredGrades.length + att.length === 0} className="px-3 h-9 rounded-full bg-secondary text-xs inline-flex gap-1.5 items-center disabled:opacity-60">
              {busy === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}Download PDF
            </button>
            <button onClick={share} disabled={busy !== null} className="px-3 h-9 rounded-full bg-navy text-white text-xs inline-flex gap-1.5 items-center disabled:opacity-60">
              {busy === "share" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}Share
            </button>
          </div>
        ) : null}
      />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in to view your real report.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && q.data && filteredGrades.length === 0 && att.length === 0 && (
        <Card className="text-center py-10">
          <FileText className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No data yet — your teachers will populate grades and attendance as the term progresses.</p>
        </Card>
      )}
      {isReal && q.data && (filteredGrades.length > 0 || att.length > 0) && (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <Stat label="Overall average" value={avg ? `${avg}%` : "—"} tone={avg >= 70 ? "good" : avg >= 50 ? "warn" : "bad"} />
            <Stat label="Attendance (60d)" value={att.length ? `${rate}%` : "—"} />
            <Stat label="Grades recorded" value={filteredGrades.length} />
          </div>
          {filteredGrades.length > 0 && (
            <Card>
              <h2 className="font-display text-xl">Grades</h2>
              <table className="w-full text-sm mt-3">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                  <tr><th className="text-left py-2">Subject</th><th>Score</th><th>Term</th><th className="text-right">Date</th></tr>
                </thead>
                <tbody>
                  {filteredGrades.slice(0, 50).map((g, i) => {
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
