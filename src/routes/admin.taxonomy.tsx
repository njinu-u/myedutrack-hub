import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { getTaxonomy, saveTaxonomy } from "@/lib/taxonomy.functions";
import { generateSections } from "@/lib/use-school-taxonomy";
import { toast } from "sonner";
import { Loader2, Plus, X, Save, BookOpen, GraduationCap, Tags } from "lucide-react";

export const Route = createFileRoute("/admin/taxonomy")({
  head: () => ({ meta: [{ title: "School Vocabulary — EduTrack" }] }),
  component: Page,
});

type Style = "alphabet" | "colors" | "numbers" | "custom";

function Page() {
  const auth = useAuth();
  const qc = useQueryClient();
  const isReal = auth.isAuthed && !auth.isDemo;
  const fetchTax = useServerFn(getTaxonomy);
  const save = useServerFn(saveTaxonomy);

  const tq = useQuery({ queryKey: ["school-taxonomy"], enabled: isReal, queryFn: () => fetchTax() });

  const [grades, setGrades] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [style, setStyle] = useState<Style>("alphabet");
  const [sections, setSections] = useState<Record<string, string[]>>({});
  const [newGrade, setNewGrade] = useState("");
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => {
    const t = tq.data?.taxonomy;
    if (t) {
      setGrades(t.grades ?? []);
      setSubjects(t.subjects ?? []);
      setStyle((t.class_style as Style) ?? "alphabet");
      setSections((t.class_sections as Record<string, string[]>) ?? {});
    }
  }, [tq.data]);

  const saveMut = useMutation({
    mutationFn: () => save({ data: { grades, class_style: style, class_sections: sections, subjects } }),
    onSuccess: () => { toast.success("School vocabulary saved"); qc.invalidateQueries({ queryKey: ["school-taxonomy"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addGrade = () => {
    const g = newGrade.trim();
    if (!g || grades.includes(g)) return;
    setGrades([...grades, g]);
    setNewGrade("");
  };
  const removeGrade = (g: string) => {
    setGrades(grades.filter((x) => x !== g));
    const next = { ...sections }; delete next[g]; setSections(next);
  };
  const addSubject = () => {
    const s = newSubject.trim();
    if (!s || subjects.includes(s)) return;
    setSubjects([...subjects, s]); setNewSubject("");
  };

  const getSectionsFor = (g: string) => sections[g] ?? (style === "custom" ? [] : generateSections(style, g));
  const setSectionsFor = (g: string, arr: string[]) => setSections({ ...sections, [g]: arr });

  return (
    <div className="space-y-6">
      <PageHead title="School Vocabulary" subtitle="Define grades, classes, and subjects used everywhere in your school." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in to customize your school vocabulary.</div></Card>}
      {isReal && tq.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && !tq.isLoading && (
        <>
          {grades.length === 0 && (
            <Card>
              <div className="text-sm">
                <b>Welcome!</b> Set up how your school names grades, classes, and subjects. These will appear for every teacher, counselor, and student.
              </div>
            </Card>
          )}

          <Card>
            <h2 className="font-display text-xl flex items-center gap-2"><GraduationCap className="h-4 w-4 text-teal" /> Grades</h2>
            <p className="text-xs text-muted-foreground mt-1">Free text — e.g. "Grade 1", "Year 7", "Form 4".</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {grades.map((g) => (
                <span key={g} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-sm">
                  {g}
                  <button onClick={() => removeGrade(g)} aria-label={`Remove ${g}`} className="text-muted-foreground hover:text-danger"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={newGrade} onChange={(e) => setNewGrade(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addGrade(); }}
                placeholder="Add a grade…" className="flex-1 px-3 py-2 rounded-lg border bg-card text-sm" />
              <button onClick={addGrade} className="px-3 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-1"><Plus className="h-3 w-3" />Add</button>
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-xl flex items-center gap-2"><Tags className="h-4 w-4 text-teal" /> Class section style</h2>
            <p className="text-xs text-muted-foreground mt-1">Choose how class sections are labeled.</p>
            <div className="mt-3 grid sm:grid-cols-4 gap-2">
              {(["alphabet", "colors", "numbers", "custom"] as Style[]).map((s) => (
                <button key={s} onClick={() => setStyle(s)} className={`px-3 py-2 rounded-lg border text-sm ${style === s ? "bg-navy text-white border-navy" : "bg-card"}`}>
                  {s === "alphabet" ? "1A, 1B, 1C" : s === "colors" ? "1 Red, 1 Blue" : s === "numbers" ? "1-1, 1-2" : "Custom"}
                </button>
              ))}
            </div>

            {grades.length > 0 && (
              <div className="mt-5 space-y-3">
                {grades.map((g) => {
                  const list = getSectionsFor(g);
                  return (
                    <div key={g} className="rounded-lg border p-3">
                      <div className="text-sm font-medium mb-2">{g}</div>
                      <div className="flex flex-wrap gap-2">
                        {list.map((c, i) => (
                          <span key={`${c}-${i}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-xs">
                            <input
                              value={c}
                              onChange={(e) => {
                                const next = [...list]; next[i] = e.target.value; setSectionsFor(g, next);
                              }}
                              className="bg-transparent outline-none w-20"
                            />
                            <button onClick={() => setSectionsFor(g, list.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-danger"><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                        <button onClick={() => setSectionsFor(g, [...list, ""])} className="px-2 py-1 rounded-full border text-xs inline-flex items-center gap-1"><Plus className="h-3 w-3" />Add section</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-xl flex items-center gap-2"><BookOpen className="h-4 w-4 text-teal" /> Subjects</h2>
            <p className="text-xs text-muted-foreground mt-1">Subjects offered at your school.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {subjects.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-sm">
                  {s}
                  <button onClick={() => setSubjects(subjects.filter((x) => x !== s))} aria-label={`Remove ${s}`} className="text-muted-foreground hover:text-danger"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addSubject(); }}
                placeholder="Add a subject…" className="flex-1 px-3 py-2 rounded-lg border bg-card text-sm" />
              <button onClick={addSubject} className="px-3 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-1"><Plus className="h-3 w-3" />Add</button>
            </div>
          </Card>

          <div className="flex justify-end">
            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="px-5 py-2.5 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-50">
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save vocabulary
            </button>
          </div>
        </>
      )}
    </div>
  );
}
