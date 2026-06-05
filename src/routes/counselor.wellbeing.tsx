import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHead } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Loader2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/counselor/wellbeing")({
  head: () => ({ meta: [{ title: "Wellbeing — EduTrack" }] }),
  component: Wellbeing,
});

type Mood = { student_id: string; mood: number; checked_at: string };
type Student = { id: string; full_name: string; grade: string | null };

const moodColor = (v: number) => v >= 4 ? "bg-success/30" : v >= 3 ? "bg-amber/20" : v >= 2 ? "bg-amber/40" : "bg-danger/40";

function Wellbeing() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  useRealtimeInvalidate(["mood_checkins"], [["counselor-wellbeing"]]);

  const q = useQuery({
    queryKey: ["counselor-wellbeing"],
    enabled: isReal,
    queryFn: async () => {
      const since = new Date(Date.now() - 56 * 86400000).toISOString();
      const [{ data: moods }, { data: students }] = await Promise.all([
        supabase.from("mood_checkins").select("student_id,mood,checked_at").gte("checked_at", since).order("checked_at", { ascending: false }),
        supabase.from("students").select("id,full_name,grade"),
      ]);
      return { moods: (moods ?? []) as Mood[], students: (students ?? []) as Student[] };
    },
  });

  const moods = q.data?.moods ?? [];
  const students = q.data?.students ?? [];

  // group avg mood by grade x week (last 8 weeks)
  const grades = Array.from(new Set(students.map((s) => s.grade).filter(Boolean) as string[])).sort();
  const sGrade = new Map(students.map((s) => [s.id, s.grade]));
  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0);
  const grid: Record<string, (number | null)[]> = {};
  for (const g of grades) grid[g] = Array(8).fill(null);
  const buckets: Record<string, number[][]> = {};
  for (const g of grades) buckets[g] = Array.from({ length: 8 }, () => [] as number[]);
  for (const m of moods) {
    const g = sGrade.get(m.student_id);
    if (!g) continue;
    const daysAgo = Math.floor((weekStart.getTime() - new Date(m.checked_at).getTime()) / 86400000);
    const wk = 7 - Math.floor(daysAgo / 7);
    if (wk < 0 || wk > 7) continue;
    buckets[g][wk].push(m.mood);
  }
  for (const g of grades) grid[g] = buckets[g].map((arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  return (
    <div className="space-y-6">
      <PageHead title="Wellbeing monitor" subtitle="Mood pulse across grades and weeks." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Sign in as counselor to view wellbeing data.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && !q.isLoading && moods.length === 0 && (
        <Card className="text-center py-10">
          <Heart className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No mood check-ins yet. Students can log mood from their portal.</p>
        </Card>
      )}
      {isReal && moods.length > 0 && grades.length > 0 && (
        <Card>
          <h2 className="font-display text-xl">Mood heatmap · 8 weeks × grades</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="text-xs">
              <thead><tr className="text-muted-foreground"><th></th>{Array.from({ length: 8 }).map((_, i) => <th key={i} className="px-3">W{i + 1}</th>)}</tr></thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g}>
                    <td className="pr-3 py-1.5 font-medium">{g}</td>
                    {grid[g].map((v, i) => (
                      <td key={i} className="p-1">
                        <div className={cn("h-9 w-12 rounded-md grid place-items-center font-medium", v == null ? "bg-secondary text-muted-foreground" : moodColor(v))}>
                          {v == null ? "—" : v.toFixed(1)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-3 text-xs text-muted-foreground"><span>1 — distressed</span><span>3 — neutral</span><span>5 — thriving</span></div>
        </Card>
      )}
    </div>
  );
}
