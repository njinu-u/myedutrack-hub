import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHead, Card } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, CalendarRange, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { generateTimetable, getTimetable, clearTimetable, DAYS, PERIODS, type TimetableSlot } from "@/lib/timetable.functions";

export const Route = createFileRoute("/admin/timetable")({
  head: () => ({ meta: [{ title: "Timetable — EduTrack" }] }),
  component: Timetable,
});

function Timetable() {
  const qc = useQueryClient();
  const fetchTT = useServerFn(getTimetable);
  const genTT = useServerFn(generateTimetable);
  const clearTT = useServerFn(clearTimetable);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-timetable"],
    queryFn: () => fetchTT(),
  });
  const slots: TimetableSlot[] = data?.items ?? [];

  const classes = useMemo(
    () => Array.from(new Set(slots.map((s) => s.class_label))).sort(),
    [slots],
  );
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const activeClass = selectedClass ?? classes[0] ?? null;

  const cellMap = useMemo(() => {
    const m = new Map<string, TimetableSlot>();
    for (const s of slots) if (s.class_label === activeClass) m.set(`${s.day}-${s.period}`, s);
    return m;
  }, [slots, activeClass]);

  const unassigned = slots.filter((s) => !s.teacher_user_id);
  const [showUnassigned, setShowUnassigned] = useState(false);

  const genMut = useMutation({
    mutationFn: () => genTT({ data: {} }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-timetable"] });
      if (res.unassigned > 0) {
        toast.warning(`Timetable generated — ${res.unassigned} slot(s) need attention`);
        setShowUnassigned(true);
      } else {
        toast.success(`Conflict-free timetable generated · ${res.total} slots across ${res.classes} classes`);
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to generate timetable"),
  });

  const clearMut = useMutation({
    mutationFn: () => clearTT(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-timetable"] }); toast.success("Timetable cleared"); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to clear timetable"),
  });

  const hasData = slots.length > 0;

  return (
    <div className="space-y-6">
      <PageHead
        title="Timetable"
        subtitle="Auto-generated from teacher assignments. Respects subject specialization and avoids double-booking teachers."
        actions={
          <>
            <button
              onClick={() => genMut.mutate()}
              disabled={genMut.isPending}
              className="px-4 py-2 rounded-full text-sm bg-navy text-white inline-flex items-center gap-2 disabled:opacity-60"
            >
              {genMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {genMut.isPending ? "Solving…" : hasData ? "Regenerate" : "Generate timetable"}
            </button>
            {hasData && (
              <button
                onClick={() => clearMut.mutate()}
                disabled={clearMut.isPending}
                className="px-4 py-2 rounded-full text-sm bg-secondary hover:bg-secondary/80 inline-flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Clear
              </button>
            )}
          </>
        }
      />

      {unassigned.length > 0 && (
        <AIBlock title={`${unassigned.length} slot(s) could not be assigned automatically`} tone="warn">
          Some classes have no available teacher for the required subject.{" "}
          <button onClick={() => setShowUnassigned(true)} className="underline">View details</button>
        </AIBlock>
      )}

      {isLoading ? (
        <Card><div className="py-12 text-center text-sm text-muted-foreground">Loading timetable…</div></Card>
      ) : !hasData ? (
        <Card>
          <div className="py-16 text-center space-y-3">
            <CalendarRange className="h-10 w-10 mx-auto text-muted-foreground" />
            <h3 className="font-display text-lg">No timetable generated yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Generate a conflict-free weekly schedule based on your teachers' assigned classes and subjects.
            </p>
            <button
              onClick={() => genMut.mutate()}
              disabled={genMut.isPending}
              className="px-4 py-2 rounded-full text-sm bg-navy text-white inline-flex items-center gap-2 disabled:opacity-60"
            >
              {genMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {genMut.isPending ? "Solving…" : "Generate timetable"}
            </button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <h2 className="font-display text-xl flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-teal" /> Weekly schedule
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {classes.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className={`text-xs px-3 py-1 rounded-full border ${c === activeClass ? "bg-navy text-white border-navy" : "bg-secondary/40 hover:bg-secondary"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left py-2 w-16"></th>
                  {DAYS.map((d) => <th key={d} className="text-left py-2">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p) => (
                  <tr key={p} className="border-t">
                    <td className="py-2 font-display">{p}</td>
                    {DAYS.map((d) => {
                      const cell = cellMap.get(`${d}-${p}`);
                      if (!cell) return <td key={d} className="py-1 pr-1"><div className="rounded-md px-2 py-2 bg-secondary/40 text-muted-foreground">—</div></td>;
                      const unassigned = !cell.teacher_user_id;
                      return (
                        <td key={d} className="py-1 pr-1">
                          <div className={`rounded-md px-2 py-2 border ${unassigned ? "bg-destructive/10 border-destructive/30" : "bg-teal/5 border-teal/20"}`}>
                            <div className="font-medium">{cell.subject ?? "—"}</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {unassigned ? (
                                <span className="inline-flex items-center gap-1 text-destructive">
                                  <AlertTriangle className="h-3 w-3" /> Unassigned
                                </span>
                              ) : cell.teacher_name ?? "Teacher"}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={showUnassigned} onOpenChange={setShowUnassigned}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unassigned slots</DialogTitle>
            <DialogDescription>
              These slots need manual attention — assign a teacher or update teacher subject assignments.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm max-h-[50vh] overflow-y-auto">
            {unassigned.map((s) => (
              <li key={s.id} className="rounded-lg border p-3">
                <div className="font-medium">{s.class_label} · {s.subject ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{s.day} {s.period} — {s.unassigned_reason ?? "No teacher available"}</div>
              </li>
            ))}
            {unassigned.length === 0 && <li className="text-muted-foreground">All slots are assigned.</li>}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
