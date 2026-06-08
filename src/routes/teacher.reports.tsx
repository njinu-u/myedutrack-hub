import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHead, Card, Stat } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getMyTeacherAssignments } from "@/lib/assignments.functions";
import { getStudentReportCard, sendReportCardToParents, type ReportCardData } from "@/lib/report-card.functions";
import { buildClassLabelSet, matchesAnyClass, studentClassCandidates } from "@/lib/class-label";
import { downloadPdf } from "@/lib/export";
import { Loader2, BarChart3, FileText, Printer, Send, Download, User } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/reports")({
  head: () => ({ meta: [{ title: "Reports — EduTrack" }] }),
  component: Page,
});

const TERMS = ["Term 1", "Term 2", "Term 3", "Mid-Year", "End-of-Year"];

type Student = { id: string; full_name: string; grade: string | null; class_id: string | null; photo_url: string | null };

function Page() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;

  const summary = useQuery({
    queryKey: ["teacher-reports"],
    enabled: isReal,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const [{ data: grades }, { data: att }, { data: obs }] = await Promise.all([
        supabase.from("grades").select("subject,score,max_score").eq("entered_by", auth.user!.id),
        supabase.from("attendance").select("status,date").eq("recorded_by", auth.user!.id).gte("date", since),
        supabase.from("observations").select("id").eq("teacher_id", auth.user!.id),
      ]);
      return { grades: grades ?? [], att: att ?? [], obs: obs ?? [] };
    },
  });

  const students = useQuery({
    queryKey: ["teacher-report-students"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id,full_name,grade,class_id,photo_url").order("full_name");
      if (error) throw new Error(error.message);
      return (data ?? []) as Student[];
    },
  });

  const fetchAssignments = useServerFn(getMyTeacherAssignments);
  const aQ = useQuery({ queryKey: ["my-teacher-assignments"], enabled: isReal, queryFn: () => fetchAssignments() });
  const myClassNorms = useMemo(
    () => buildClassLabelSet((aQ.data?.items ?? []).map((a) => a.class_label)),
    [aQ.data],
  );
  const myStudents = useMemo(
    () => (students.data ?? []).filter((s) => matchesAnyClass(studentClassCandidates(s), myClassNorms)),
    [students.data, myClassNorms],
  );

  const grades = summary.data?.grades ?? [];
  const att = summary.data?.att ?? [];
  const obs = summary.data?.obs ?? [];
  const avg = grades.length ? Math.round(grades.reduce((a, g) => a + (g.score / g.max_score) * 100, 0) / grades.length) : 0;
  const present = att.filter((a) => a.status === "present").length;
  const rate = att.length ? Math.round((present / att.length) * 100) : 0;
  const bySubject = new Map<string, { total: number; n: number }>();
  for (const g of grades) {
    const o = bySubject.get(g.subject) ?? { total: 0, n: 0 };
    o.total += (g.score / g.max_score) * 100; o.n++;
    bySubject.set(g.subject, o);
  }

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [term, setTerm] = useState(TERMS[0]);
  const [customNote, setCustomNote] = useState("");

  const fetchCard = useServerFn(getStudentReportCard);
  const card = useQuery({
    queryKey: ["report-card", selectedId, term],
    enabled: isReal && !!selectedId,
    queryFn: () => fetchCard({ data: { student_id: selectedId!, term } }),
  });

  const sendFn = useServerFn(sendReportCardToParents);
  const sendMut = useMutation({
    mutationFn: (payload: { student_id: string; term: string; subject: string; body: string }) => sendFn({ data: payload }),
    onSuccess: (res) => {
      if (res.reason === "no_parent_account") {
        toast.error("No linked parent accounts found for this student. Invite the parent first from Admin → Students.");
      } else {
        toast.success(`Report card sent to ${res.sent} parent${res.sent === 1 ? "" : "s"}.`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onPrint = () => {
    const el = document.getElementById("report-card-printable");
    if (!el) return;
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) { toast.error("Pop-up blocked. Allow pop-ups to print."); return; }
    w.document.write(`<!doctype html><html><head><title>Report Card</title>
      <style>
        body{font-family:Inter,system-ui,sans-serif;color:#0f172a;padding:32px;}
        h1{font-size:24px;margin:0 0 4px;} h2{font-size:16px;margin:18px 0 8px;}
        .muted{color:#64748b;font-size:12px;}
        table{width:100%;border-collapse:collapse;margin-top:8px;}
        th,td{border:1px solid #e2e8f0;padding:8px;font-size:13px;text-align:left;}
        th{background:#f1f5f9;}
        .stats{display:flex;gap:16px;margin:12px 0;}
        .stat{border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;flex:1;}
        .stat .v{font-size:20px;font-weight:600;}
        .obs{border-left:3px solid #14b8a6;padding:6px 10px;margin:6px 0;background:#f8fafc;}
      </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  const onDownloadPdf = () => {
    const c = card.data; if (!c) return;
    downloadPdf(
      `report-card-${c.student.full_name.replace(/\s+/g, "-").toLowerCase()}-${c.term.replace(/\s+/g, "-").toLowerCase()}`,
      `${c.student.full_name} · ${c.term} Report Card`,
      [
        { type: "paragraph", text: `${c.school.name ?? "School"} · ${c.student.grade ?? ""}${c.student.class_id ? " · " + c.student.class_id : ""}` },
        { type: "heading", text: "Academic results" },
        { type: "table",
          head: ["Subject", "Score", "Out of", "Percent"],
          body: c.subjects.length
            ? c.subjects.map((s) => [s.subject, s.score, s.max_score, `${s.percent}%`])
            : [["No grades recorded for this term", "", "", ""]],
        },
        { type: "paragraph", text: c.average != null ? `Overall average: ${c.average}%` : "Overall average: —" },
        { type: "heading", text: "Attendance" },
        { type: "paragraph", text: `Present ${c.attendance.present} · Absent ${c.attendance.absent} · Late ${c.attendance.late} · Rate ${c.attendance.rate}%` },
        ...(c.observations.length
          ? [{ type: "heading" as const, text: "Teacher observations" },
             ...c.observations.map((o) => ({ type: "paragraph" as const, text: `${new Date(o.created_at).toLocaleDateString()} — ${o.note}` }))]
          : []),
        ...(customNote.trim()
          ? [{ type: "heading" as const, text: "Teacher's note" }, { type: "paragraph" as const, text: customNote.trim() }]
          : []),
      ],
    );
  };

  const onSend = () => {
    const c = card.data; if (!c || !selectedId) return;
    const lines: string[] = [];
    lines.push(`${c.student.full_name} — ${c.term} report card`);
    if (c.school.name) lines.push(c.school.name);
    lines.push("");
    lines.push("Academic results:");
    if (c.subjects.length === 0) lines.push("  No grades recorded for this term.");
    for (const s of c.subjects) lines.push(`  ${s.subject}: ${s.score}/${s.max_score} (${s.percent}%)`);
    if (c.average != null) lines.push(`Overall average: ${c.average}%`);
    lines.push("");
    lines.push(`Attendance: ${c.attendance.present} present, ${c.attendance.absent} absent, ${c.attendance.late} late (${c.attendance.rate}% rate)`);
    if (c.observations.length) {
      lines.push("");
      lines.push("Observations:");
      for (const o of c.observations.slice(0, 5)) lines.push(`  • ${o.note}`);
    }
    if (customNote.trim()) { lines.push(""); lines.push("Teacher's note:"); lines.push(customNote.trim()); }
    sendMut.mutate({
      student_id: selectedId,
      term,
      subject: `${c.term} report card — ${c.student.full_name}`,
      body: lines.join("\n"),
    });
  };

  return (
    <div className="space-y-6">
      <PageHead title="My Reports" subtitle="Class snapshot, plus individual student report cards." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in to view your reports.</div></Card>}
      {isReal && summary.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && summary.data && grades.length === 0 && att.length === 0 && obs.length === 0 && (
        <Card className="text-center py-10">
          <BarChart3 className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No data yet. Once you enter grades, take attendance or log observations, summaries appear here.</p>
        </Card>
      )}
      {isReal && summary.data && (grades.length > 0 || att.length > 0 || obs.length > 0) && (
        <>
          <div className="grid sm:grid-cols-4 gap-3">
            <Stat label="Grades entered" value={grades.length} />
            <Stat label="Class avg" value={avg ? `${avg}%` : "—"} tone={avg >= 70 ? "good" : avg >= 50 ? "warn" : "bad"} />
            <Stat label="Attendance rate (30d)" value={att.length ? `${rate}%` : "—"} />
            <Stat label="Observations" value={obs.length} />
          </div>
          {bySubject.size > 0 && (
            <Card>
              <h2 className="font-display text-xl">Average by subject</h2>
              <ul className="mt-3 space-y-2">
                {[...bySubject.entries()].map(([s, o]) => {
                  const a = Math.round(o.total / o.n);
                  return (
                    <li key={s} className="flex items-center gap-3">
                      <span className="w-32 text-sm font-medium">{s}</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-teal" style={{ width: `${a}%` }} /></div>
                      <span className="text-sm w-12 text-right">{a}%</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </>
      )}

      {isReal && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-teal" />
            <h2 className="font-display text-xl">Student report cards</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Pick a student in one of your classes, choose a term, then print or send the report card to their parents.</p>

          {myStudents.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No students in your classes yet. Set classes in <span className="font-medium">Teacher → Setup</span>.
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-[1fr_180px] gap-3 mb-4">
                <select
                  value={selectedId ?? ""}
                  onChange={(e) => setSelectedId(e.target.value || null)}
                  className="px-3 h-10 rounded-lg border bg-card text-sm"
                >
                  <option value="">Select a student…</option>
                  {myStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} {s.class_id ? `· ${s.class_id}` : s.grade ? `· ${s.grade}` : ""}
                    </option>
                  ))}
                </select>
                <select value={term} onChange={(e) => setTerm(e.target.value)} className="px-3 h-10 rounded-lg border bg-card text-sm">
                  {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {selectedId && card.isLoading && (
                <div className="py-10 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin text-teal" /></div>
              )}

              {selectedId && card.data && (
                <ReportCardPreview
                  data={card.data}
                  customNote={customNote}
                  onNoteChange={setCustomNote}
                  onPrint={onPrint}
                  onDownload={onDownloadPdf}
                  onSend={onSend}
                  sending={sendMut.isPending}
                />
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}

function ReportCardPreview({
  data, customNote, onNoteChange, onPrint, onDownload, onSend, sending,
}: {
  data: ReportCardData;
  customNote: string;
  onNoteChange: (v: string) => void;
  onPrint: () => void;
  onDownload: () => void;
  onSend: () => void;
  sending: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-end mb-3">
        <button onClick={onPrint} className="px-3 py-1.5 rounded-full bg-secondary text-xs inline-flex gap-1.5"><Printer className="h-3.5 w-3.5" />Print</button>
        <button onClick={onDownload} className="px-3 py-1.5 rounded-full bg-secondary text-xs inline-flex gap-1.5"><Download className="h-3.5 w-3.5" />Download PDF</button>
        <button onClick={onSend} disabled={sending} className="px-3 py-1.5 rounded-full bg-navy text-white text-xs inline-flex gap-1.5 disabled:opacity-60">
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {sending ? "Sending…" : `Send to parent${data.parents.length === 1 ? "" : "s"}`}
        </button>
      </div>

      <div id="report-card-printable" className="rounded-2xl border p-6 bg-card">
        <div className="flex items-center gap-4">
          {data.student.photo_url
            ? <img src={data.student.photo_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            : <div className="h-16 w-16 rounded-2xl bg-secondary grid place-items-center"><User className="h-7 w-7 text-muted-foreground" /></div>}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl">{data.student.full_name}</h1>
            <div className="muted text-xs text-muted-foreground">
              {data.school.name ?? "School"} · {data.student.grade ?? "—"}{data.student.class_id ? ` · ${data.student.class_id}` : ""} · {data.term}
            </div>
          </div>
        </div>

        <h2 className="font-display text-base mt-5">Academic results</h2>
        {data.subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">No grades recorded for this term.</p>
        ) : (
          <table className="w-full mt-2 text-sm">
            <thead>
              <tr className="bg-secondary/60">
                <th className="text-left p-2 border">Subject</th>
                <th className="text-left p-2 border">Score</th>
                <th className="text-left p-2 border">Out of</th>
                <th className="text-left p-2 border">Percent</th>
              </tr>
            </thead>
            <tbody>
              {data.subjects.map((s) => (
                <tr key={s.subject}>
                  <td className="p-2 border">{s.subject}</td>
                  <td className="p-2 border">{s.score}</td>
                  <td className="p-2 border">{s.max_score}</td>
                  <td className="p-2 border">{s.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-sm mt-2"><span className="font-medium">Overall average:</span> {data.average != null ? `${data.average}%` : "—"}</p>

        <h2 className="font-display text-base mt-5">Attendance</h2>
        <div className="stats flex gap-3 mt-2">
          <div className="stat flex-1 border rounded-xl p-3"><div className="muted text-xs text-muted-foreground">Present</div><div className="v font-display text-xl">{data.attendance.present}</div></div>
          <div className="stat flex-1 border rounded-xl p-3"><div className="muted text-xs text-muted-foreground">Absent</div><div className="v font-display text-xl">{data.attendance.absent}</div></div>
          <div className="stat flex-1 border rounded-xl p-3"><div className="muted text-xs text-muted-foreground">Late</div><div className="v font-display text-xl">{data.attendance.late}</div></div>
          <div className="stat flex-1 border rounded-xl p-3"><div className="muted text-xs text-muted-foreground">Rate</div><div className="v font-display text-xl">{data.attendance.rate}%</div></div>
        </div>

        {data.observations.length > 0 && (
          <>
            <h2 className="font-display text-base mt-5">Teacher observations</h2>
            <div className="mt-2 space-y-2">
              {data.observations.map((o) => (
                <div key={o.id} className="obs border-l-4 border-teal pl-3 py-1.5 bg-secondary/40 rounded">
                  <div className="muted text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}{o.subject ? ` · ${o.subject}` : ""}</div>
                  <div className="text-sm">{o.note}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {customNote.trim() && (
          <>
            <h2 className="font-display text-base mt-5">Teacher's note</h2>
            <p className="text-sm mt-1 whitespace-pre-line">{customNote.trim()}</p>
          </>
        )}
      </div>

      <div className="mt-4">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Teacher's note (optional, included in printout and parent message)</label>
        <textarea
          value={customNote}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={3}
          placeholder="Add a personal comment for the parent…"
          className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm"
        />
      </div>

      {data.parents.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          No parent accounts linked to this student yet. Ask your admin to invite the parent so report cards can be sent in-app.
        </p>
      )}
    </div>
  );
}
