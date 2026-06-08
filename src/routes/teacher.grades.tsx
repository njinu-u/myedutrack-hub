import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listGradesForClass, upsertGrade } from "@/lib/grades.functions";
import { listStudents } from "@/lib/students.functions";
import { getMyTeacherAssignments } from "@/lib/assignments.functions";
import { getTaxonomy } from "@/lib/taxonomy.functions";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Loader2, Save, BookOpen, Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildClassLabelSet, matchesAnyClass, studentClassCandidates } from "@/lib/class-label";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export const Route = createFileRoute("/teacher/grades")({ component: TeacherGrades });

const TERMS = ["Term 1", "Term 2", "Term 3"];

function TeacherGrades() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  if (!isReal) {
    return (
      <div className="space-y-6">
        <PageHead title="Grade entry" subtitle="Edit grades for your class — saves instantly." />
        <Card><div className="text-sm text-muted-foreground">Demo preview. Sign in to update real grades against your roster.</div></Card>
      </div>
    );
  }
  return <RealGrades />;
}

function RealGrades() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listStudents);
  const fetchGrades = useServerFn(listGradesForClass);
  const fetchAssignments = useServerFn(getMyTeacherAssignments);
  const fetchTaxonomy = useServerFn(getTaxonomy);
  const save = useServerFn(upsertGrade);

  const [subject, setSubject] = useState<string>("");
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [term, setTerm] = useState(TERMS[1]);
  const [classKey, setClassKey] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const sQ = useQuery({ queryKey: ["all-students"], queryFn: () => fetchList() });
  const aQ = useQuery({ queryKey: ["my-teacher-assignments"], queryFn: () => fetchAssignments() });
  const tQ = useQuery({ queryKey: ["school-taxonomy"], queryFn: () => fetchTaxonomy() });

  // all subjects configured by the school admin
  const schoolSubjects = useMemo(() => tQ.data?.taxonomy?.subjects ?? [], [tQ.data]);

  const myClassNorms = useMemo(
    () => buildClassLabelSet((aQ.data?.items ?? []).map((a) => a.class_label)),
    [aQ.data],
  );

  const classes = useMemo(() => {
    const set = new Map<string, string>();
    for (const s of sQ.data?.students ?? []) {
      const key = s.class_id ? `class:${s.class_id}` : s.grade ? `grade:${s.grade}` : "";
      const label = s.class_id ? `Class ${s.class_id}` : s.grade ? `Grade ${s.grade}` : "Unassigned";
      if (!key) continue;
      if (!matchesAnyClass(studentClassCandidates(s), myClassNorms)) continue;
      set.set(key, label);
    }
    return [...set.entries()].map(([k, v]) => ({ key: k, label: v }));
  }, [sQ.data, myClassNorms]);

  useEffect(() => { if (!classKey && classes.length) setClassKey(classes[0].key); }, [classes, classKey]);
  useEffect(() => { if (!subject && schoolSubjects.length) setSubject(schoolSubjects[0]); }, [schoolSubjects, subject]);

  const class_id = classKey.startsWith("class:") ? classKey.slice(6) : null;
  const grade = classKey.startsWith("grade:") ? classKey.slice(6) : null;

  useRealtimeInvalidate(["grades"], [["teacher-grades", classKey, subject, term]]);

  const gQ = useQuery({
    queryKey: ["teacher-grades", classKey, subject, term],
    enabled: !!classKey && !!subject,
    queryFn: () => fetchGrades({ data: { class_id, grade, subject, term } }),
  });

  useEffect(() => { setDrafts({}); }, [classKey, subject, term]);

  const rows = gQ.data?.rows ?? [];

  const saveOne = async (student_id: string, current: number | null, max: number) => {
    const raw = drafts[student_id];
    const num = raw === undefined ? current : Number(raw);
    if (num === null || Number.isNaN(num as number) || (num as number) < 0 || (num as number) > max) {
      toast.error(`Score must be between 0 and ${max}`); return;
    }
    setSavingId(student_id);
    try {
      await save({ data: { student_id, subject, term, score: num as number, max_score: max } });
      toast.success("Saved");
      setDrafts((d) => { const { [student_id]: _x, ...rest } = d; return rest; });
      qc.invalidateQueries({ queryKey: ["teacher-grades", classKey, subject, term] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setSavingId(null); }
  };

  return (
    <div className="space-y-6">
      <PageHead
        title={`Grade entry${subject ? ` · ${subject}` : ""} · ${term}`}
        subtitle="Edit a score, then Save. Updates appear live across the school."
        actions={
          <div className="flex gap-2 flex-wrap">
            <select value={classKey} onChange={(e) => setClassKey(e.target.value)} className="px-3 h-9 rounded-full border bg-card text-sm">
              {classes.length === 0 && <option value="">No classes</option>}
              {classes.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <Popover open={subjectOpen} onOpenChange={setSubjectOpen}>
              <PopoverTrigger asChild>
                <button
                  className="px-3 h-9 rounded-full border bg-card text-sm inline-flex items-center justify-between gap-2 min-w-[10rem]"
                  aria-expanded={subjectOpen}
                >
                  <span className={cn(!subject && "text-muted-foreground")}>
                    {subject || "Select subject"}
                  </span>
                  <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <Command>
                  <CommandInput placeholder="Search subject…" />
                  <CommandList>
                    <CommandEmpty>No subject found.</CommandEmpty>
                    <CommandGroup>
                      {schoolSubjects.map((s) => (
                        <CommandItem
                          key={s}
                          value={s}
                          onSelect={(currentValue) => {
                            setSubject(currentValue);
                            setSubjectOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              subject === s ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {s}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <select value={term} onChange={(e) => setTerm(e.target.value)} className="px-3 h-9 rounded-full border bg-card text-sm">
              {TERMS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        }
      />
      <Card>
        {(sQ.isLoading || aQ.isLoading || tQ.isLoading || gQ.isLoading) ? (
          <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-teal" /></div>
        ) : schoolSubjects.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="h-6 w-6 mx-auto text-teal" />
            <p className="text-sm text-muted-foreground mt-3">No subjects have been configured yet. Ask your admin to set them up in <Link to="/admin/taxonomy" className="font-medium underline">Admin → School Vocabulary</Link>.</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="h-6 w-6 mx-auto text-teal" />
            <p className="text-sm text-muted-foreground mt-3">No students yet in your assigned classes.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No students in this class.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs uppercase tracking-wider text-muted-foreground border-b">
              <th className="text-left py-3">Student</th><th className="text-center">Score / Max</th><th className="text-center">Percent</th><th className="text-right">Action</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const val = drafts[r.student_id] ?? (r.score === null ? "" : String(r.score));
                const num = Number(val);
                const pct = !Number.isNaN(num) && val !== "" ? Math.round((num / r.max_score) * 100) : null;
                const tone = pct === null ? "border-border" : pct < 50 ? "border-danger/40 text-danger bg-danger/5" : pct < 70 ? "border-amber/40 text-amber bg-amber/5" : "border-success/30 text-success bg-success/5";
                const dirty = drafts[r.student_id] !== undefined && Number(drafts[r.student_id]) !== r.score;
                return (
                  <tr key={r.student_id} className="border-b hover:bg-secondary/40">
                    <td className="py-3 flex items-center gap-2.5">
                      <img src={r.photo_url ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.full_name)}`} className="h-8 w-8 rounded-full object-cover" alt="" />
                      {r.full_name}
                    </td>
                    <td className="text-center">
                      <input
                        value={val}
                        inputMode="numeric"
                        onChange={(e) => setDrafts((d) => ({ ...d, [r.student_id]: e.target.value }))}
                        className={cn("w-16 text-center py-1.5 rounded-md font-medium border bg-background", tone)}
                      />
                      <span className="text-muted-foreground"> / {r.max_score}</span>
                    </td>
                    <td className="text-center text-muted-foreground">{pct === null ? "—" : `${pct}%`}</td>
                    <td className="text-right">
                      <button
                        disabled={savingId !== null || !dirty}
                        onClick={() => saveOne(r.student_id, r.score, r.max_score)}
                        className="px-3 h-8 rounded-full bg-navy text-white text-xs inline-flex gap-1.5 items-center disabled:opacity-40"
                      >
                        {savingId === r.student_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
