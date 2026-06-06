import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHead, Card } from "@/components/portal-layout";
import { useSchoolTaxonomy } from "@/lib/use-school-taxonomy";
import { getMyCounselorAssignments, saveMyCounselorAssignments } from "@/lib/assignments.functions";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/counselor/setup")({
  head: () => ({ meta: [{ title: "My Assigned Classes — EduTrack" }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const tax = useSchoolTaxonomy();
  const fetchMine = useServerFn(getMyCounselorAssignments);
  const save = useServerFn(saveMyCounselorAssignments);

  const mine = useQuery({ queryKey: ["my-counselor-assignments"], queryFn: () => fetchMine() });
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (mine.data) setPicked(new Set(mine.data.items.map((i) => i.class_label)));
  }, [mine.data]);

  const toggle = (c: string) => {
    const next = new Set(picked); next.has(c) ? next.delete(c) : next.add(c); setPicked(next);
  };

  const saveMut = useMutation({
    mutationFn: () => save({ data: { class_labels: Array.from(picked) } }),
    onSuccess: () => { toast.success("Your assigned classes saved"); qc.invalidateQueries({ queryKey: ["my-counselor-assignments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHead title="My Assigned Classes" subtitle="Pick the classes you support. Your roster and session log will be filtered to these." />
      {tax.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {!tax.isLoading && tax.allClasses.length === 0 && (
        <Card>
          <div className="text-sm">Your school admin hasn't set up classes yet. Once they do, this page will let you pick which you support.</div>
        </Card>
      )}
      {tax.allClasses.length > 0 && (
        <>
          <Card>
            <h2 className="font-display text-xl">Select your classes</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tax.allClasses.map((c) => {
                const checked = picked.has(c);
                return (
                  <button key={c} onClick={() => toggle(c)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${checked ? "bg-navy text-white border-navy" : "bg-card"}`}>
                    {c}
                  </button>
                );
              })}
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
