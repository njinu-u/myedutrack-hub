import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { useAuth } from "@/lib/auth";
import { STUDENTS } from "@/lib/mock-data";
import { listObservations, listMyStudents, createObservation } from "@/lib/observations.functions";
import { toast } from "sonner";
import { BookMarked, Loader2, Plus, Sparkles, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/observations")({
  head: () => ({ meta: [{ title: "Observations — EduTrack" }] }),
  component: Page,
});

const TAGS = ["Academic", "Social", "Behavioral", "Emotional", "Physical", "Language"] as const;
type Tag = typeof TAGS[number];

function Page() {
  const auth = useAuth();
  const qc = useQueryClient();
  const fetchObs = useServerFn(listObservations);
  const fetchStudents = useServerFn(listMyStudents);
  const create = useServerFn(createObservation);

  const isReal = auth.isAuthed && !auth.isDemo;

  const obsQuery = useQuery({
    queryKey: ["observations", "all"],
    queryFn: () => fetchObs({ data: {} }),
    enabled: isReal,
  });
  const studentsQuery = useQuery({
    queryKey: ["observations", "students"],
    queryFn: () => fetchStudents(),
    enabled: isReal,
  });

  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);

  const realStudents = studentsQuery.data?.students ?? [];
  const studentOptions = isReal
    ? realStudents.map((s) => ({ id: s.id, name: s.full_name }))
    : STUDENTS.map((s) => ({ id: s.id, name: s.name }));
  const hasStudents = studentOptions.length > 0;

  useEffect(() => {
    if (!studentId && studentOptions[0]) setStudentId(studentOptions[0].id);
  }, [studentOptions, studentId]);

  const m = useMutation({
    mutationFn: async () => create({ data: { student_id: studentId, subject: subject || null, note, tags } }),
    onSuccess: () => {
      toast.success("Observation saved · AI generated next steps");
      setNote(""); setTags([]); setSubject("");
      qc.invalidateQueries({ queryKey: ["observations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const observations = isReal ? (obsQuery.data?.observations ?? []) : [];
  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    studentOptions.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [studentOptions]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReal) { toast.info("Demo mode — sign in to save observations and get AI suggestions."); return; }
    if (!studentId || note.trim().length < 3) { toast.error("Pick a student and write at least a few words."); return; }
    m.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Observations"
        subtitle="Capture quick notes about a student. AI suggests next steps using their recent grades, prior observations, and mood."
      />

      {!isReal && (
        <AIBlock title="Demo mode" tone="warn">
          You're previewing the Observations module. <span className="font-medium">Sign in or invite teachers to your school</span> to save real observations and unlock AI next-step suggestions.
        </AIBlock>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-xl flex items-center gap-2"><Plus className="h-4 w-4 text-teal" />New observation</h2>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Student</span>
              {hasStudents ? (
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm">
                  {studentOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : (
                <div className="mt-1 text-xs text-muted-foreground p-3 rounded-lg border bg-secondary/40">
                  No students enrolled yet. Ask your admin to add students before logging observations.
                </div>
              )}
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Subject (optional)</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Math, Reading"
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Note</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} placeholder="What did you observe today?"
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm resize-none" />
            </label>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Tag className="h-3 w-3" /> Tags</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TAGS.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button type="button" key={t}
                      onClick={() => setTags((prev) => active ? prev.filter(x => x !== t) : [...prev, t])}
                      className={cn("px-2.5 py-1 rounded-full text-xs border transition",
                        active ? "bg-teal text-white border-teal" : "bg-card hover:border-teal")}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <button type="submit" disabled={m.isPending}
              className="w-full py-2.5 rounded-full bg-navy text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {m.isPending ? "Saving & analyzing…" : "Save & get AI next steps"}
            </button>
          </form>
        </Card>

        <Card className="lg:col-span-3">
          <h2 className="font-display text-xl flex items-center gap-2"><BookMarked className="h-4 w-4 text-teal" />Timeline</h2>
          {!isReal && (
            <p className="text-xs text-muted-foreground mt-2">Real observations appear here once your school is set up.</p>
          )}
          {isReal && obsQuery.isLoading && (
            <div className="mt-4 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />)}
            </div>
          )}
          {isReal && !obsQuery.isLoading && observations.length === 0 && (
            <div className="mt-6 text-center py-10 text-sm text-muted-foreground">
              No observations yet. Capture your first one on the left.
            </div>
          )}
          <ul className="mt-4 space-y-3">
            {observations.map((o) => (
              <li key={o.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{studentNameById.get(o.student_id) ?? "Student"}</span>
                  <span>{new Date(o.created_at).toLocaleString()}</span>
                </div>
                {o.subject && <div className="text-[10px] uppercase tracking-wider text-teal mt-1">{o.subject}</div>}
                <p className="text-sm mt-2 leading-relaxed">{o.note}</p>
                {!!o.tags?.length && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {o.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary">{t}</span>)}
                  </div>
                )}
                {o.ai_suggestions && (
                  <div className="mt-3 rounded-lg bg-teal/5 border border-teal/20 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-teal flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI next steps</div>
                    <div className="text-sm mt-1 whitespace-pre-wrap leading-relaxed">{o.ai_suggestions}</div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
