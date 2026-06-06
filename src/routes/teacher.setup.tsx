import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHead, Card } from "@/components/portal-layout";
import { useSchoolTaxonomy } from "@/lib/use-school-taxonomy";
import { getMyTeacherAssignments, saveMyTeacherAssignments } from "@/lib/assignments.functions";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/teacher/setup")({
  head: () => ({ meta: [{ title: "My Classes & Subjects — EduTrack" }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const tax = useSchoolTaxonomy();
  const fetchMine = useServerFn(getMyTeacherAssignments);
  const save = useServerFn(saveMyTeacherAssignments);

  const mine = useQuery({ queryKey: ["my-teacher-assignments"], queryFn: () => fetchMine() });

  const [picked, setPicked] = useState<Set<string>>(new Set()); // key: `${class}|${subject}`

  useEffect(() => {
    if (mine.data) {
      setPicked(new Set(mine.data.items.map((i) => `${i.class_label}|${i.subject ?? ""}`)));
    }
  }, [mine.data]);

  const toggle = (cls: string, subj: string) => {
    const key = `${cls}|${subj}`;
    const next = new Set(picked);
    next.has(key) ? next.delete(key) : next.add(key);
    setPicked(next);
  };

  const saveMut = useMutation({
    mutationFn: () => save({
      data: {
        items: Array.from(picked).map((k) => {
          const [class_label, subject] = k.split("|");
          return { class_label, subject: subject || null };
        }),
      },
    }),
    onSuccess: () => { toast.success("Your classes & subjects saved"); qc.invalidateQueries({ queryKey: ["my-teacher-assignments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHead title="My Classes & Subjects" subtitle="Pick the classes you teach and the subjects you teach in each. Your dashboard will be filtered to these." />
      {tax.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {!tax.isLoading && (tax.allClasses.length === 0 || tax.subjects.length === 0) && (
        <Card>
          <div className="text-sm">Your school admin hasn't set up classes and subjects yet. Once they do, this page will let you pick which you teach.</div>
        </Card>
      )}
      {tax.allClasses.length > 0 && tax.subjects.length > 0 && (
        <>
          <Card>
            <h2 className="font-display text-xl">Select your classes & subjects</h2>
            <p className="text-xs text-muted-foreground mt-1">Check each subject you teach in each class.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 font-medium">Class</th>
                    {tax.subjects.map((s) => <th key={s} className="text-center py-2 font-medium">{s}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {tax.allClasses.map((c) => (
                    <tr key={c} className="border-b last:border-0">
                      <td className="py-2 font-medium">{c}</td>
                      {tax.subjects.map((s) => {
                        const checked = picked.has(`${c}|${s}`);
                        return (
                          <td key={s} className="text-center">
                            <input type="checkbox" checked={checked} onChange={() => toggle(c, s)} className="h-4 w-4 accent-navy" />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="flex justify-end">
            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
              className="px-5 py-2.5 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-50">
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}
