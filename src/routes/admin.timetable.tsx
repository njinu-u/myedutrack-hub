import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHead, Card } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CalendarRange, Loader2, Play, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/timetable")({
  head: () => ({ meta: [{ title: "Timetable — EduTrack" }] }),
  component: Timetable,
});

const PERIODS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SAMPLE: Record<string, string> = {
  "Mon-08:00": "Math · 7B · Rm 12",
  "Mon-09:00": "English · 7B · Rm 12",
  "Tue-10:00": "Science · 9A · Lab 2",
  "Wed-08:00": "Math · 8A · Rm 4",
  "Thu-11:00": "Art · 6C · Studio",
  "Fri-12:00": "PE · 7B · Gym",
};

function Timetable() {
  const [generating, setGenerating] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);

  const autoGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setGenerating(false);
    toast.success("Conflict-free timetable generated for 24 classes · 0 clashes");
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Timetable"
        subtitle="Drag-and-drop scheduling with constraint solving. Auto-generate, see live classes, or arrange cover."
        actions={
          <>
            <button onClick={autoGenerate} disabled={generating}
              className="px-4 py-2 rounded-full text-sm bg-navy text-white inline-flex items-center gap-2 disabled:opacity-60">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Solving…" : "Auto-generate"}
            </button>
            <button onClick={() => setLiveOpen(true)} className="px-4 py-2 rounded-full text-sm bg-secondary hover:bg-secondary/80 inline-flex items-center gap-2">
              <Play className="h-4 w-4" /> Live view
            </button>
            <button onClick={() => setSubOpen(true)} className="px-4 py-2 rounded-full text-sm bg-secondary hover:bg-secondary/80 inline-flex items-center gap-2">
              <Users className="h-4 w-4" /> Find substitute
            </button>
          </>
        }
      />

      <AIBlock title="Solver ready" tone="info">
        Click <span className="font-medium">Auto-generate</span> to rebuild the timetable for next term — current constraints: 38 teachers, 24 rooms, 12 elective combinations.
      </AIBlock>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl flex items-center gap-2"><CalendarRange className="h-4 w-4 text-teal" />This week</h2>
          <span className="text-xs text-muted-foreground">All times local · 7B shown</span>
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
                    const k = `${d}-${p}`;
                    const cell = SAMPLE[k];
                    return (
                      <td key={k} className="py-1 pr-1">
                        <button
                          onClick={() => toast.info(cell ? `${cell} — drag to reschedule` : "Empty slot — click to assign")}
                          className={`w-full text-left rounded-md px-2 py-2 border ${cell ? "bg-teal/5 border-teal/20 hover:bg-teal/10" : "bg-secondary/40 hover:bg-secondary border-transparent"}`}>
                          {cell ?? <span className="text-muted-foreground">—</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={liveOpen} onOpenChange={setLiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Live now</DialogTitle>
            <DialogDescription>4 classes are running school-wide right now.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            <li className="rounded-lg border p-3"><b>Math · 7B</b> — Ms. Odhiambo · Room 12 · 22 students</li>
            <li className="rounded-lg border p-3"><b>English · 8A</b> — Mr. Kamau · Room 7 · 24 students</li>
            <li className="rounded-lg border p-3"><b>Science · 9A</b> — Dr. Patel · Lab 2 · 19 students</li>
            <li className="rounded-lg border p-3"><b>Art · 6C</b> — Ms. Yusuf · Studio · 18 students</li>
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find a substitute</DialogTitle>
            <DialogDescription>AI suggests teachers free this period with matching subject expertise.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            <li className="rounded-lg border p-3 flex items-center justify-between"><span><b>Mr. Adeyemi</b> — Free 10–11, Math specialist</span>
              <button onClick={() => { setSubOpen(false); toast.success("Cover assigned · Mr. Adeyemi notified"); }} className="text-xs px-3 py-1 rounded-full bg-navy text-white">Assign</button></li>
            <li className="rounded-lg border p-3 flex items-center justify-between"><span><b>Ms. Banda</b> — Free 10–12, Science</span>
              <button onClick={() => { setSubOpen(false); toast.success("Cover assigned · Ms. Banda notified"); }} className="text-xs px-3 py-1 rounded-full bg-navy text-white">Assign</button></li>
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
