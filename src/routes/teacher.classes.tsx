import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Loader2, Users, BarChart3 } from "lucide-react";
import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/teacher/classes")({
  head: () => ({ meta: [{ title: "My Classes — EduTrack" }] }),
  component: Page,
});

type Student = { id: string; full_name: string; grade: string | null; class_id: string | null; photo_url: string | null };
const RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function Page() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  const [days, setDays] = useState(14);

  useRealtimeInvalidate(["attendance"], [["teacher-engagement", String(days)]]);

  const q = useQuery({
    queryKey: ["teacher-classes"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id,full_name,grade,class_id,photo_url").order("class_id").order("full_name");
      if (error) throw new Error(error.message);
      return (data ?? []) as Student[];
    },
  });

  const eq = useQuery({
    queryKey: ["teacher-engagement", String(days)],
    enabled: isReal,
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase.from("attendance").select("student_id,status,date").gte("date", since);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const groups = useMemo(() => {
    const g = new Map<string, Student[]>();
    for (const s of q.data ?? []) {
      const k = s.class_id || s.grade || "Unassigned";
      const arr = g.get(k) ?? []; arr.push(s); g.set(k, arr);
    }
    return g;
  }, [q.data]);

  const engagement = useMemo(() => {
    const studentClass = new Map<string, string>();
    for (const s of q.data ?? []) studentClass.set(s.id, s.class_id || s.grade || "Unassigned");
    const tally = new Map<string, { present: number; total: number }>();
    for (const a of eq.data ?? []) {
      const k = studentClass.get(a.student_id); if (!k) continue;
      const t = tally.get(k) ?? { present: 0, total: 0 };
      t.total += 1; if (a.status === "present") t.present += 1;
      tally.set(k, t);
    }
    return [...groups.keys()].map((k) => {
      const t = tally.get(k);
      return { class: k, rate: t && t.total ? Math.round((t.present / t.total) * 100) : 0, records: t?.total ?? 0 };
    });
  }, [eq.data, q.data, groups]);

  const hasAnyAttendance = engagement.some((e) => e.records > 0);

  return (
    <div className="space-y-6">
      <PageHead title="My Classes" subtitle="All classes you teach this term." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in to view your live class roster.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && !q.isLoading && groups.size === 0 && (
        <Card className="text-center py-10">
          <Users className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No students enrolled. Ask your admin to add students from <span className="font-medium">Admin → Students</span>.</p>
        </Card>
      )}
      {isReal && groups.size > 0 && (
        <>
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <h2 className="font-display text-xl">Class engagement</h2>
                <p className="text-xs text-muted-foreground">Attendance rate per class · live updates</p>
              </div>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-3 h-9 rounded-full border bg-card text-sm">
                {RANGES.map((r) => <option key={r.days} value={r.days}>{r.label}</option>)}
              </select>
            </div>
            {eq.isLoading ? (
              <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-teal" /></div>
            ) : !hasAnyAttendance ? (
              <div className="py-10 text-center">
                <BarChart3 className="h-6 w-6 mx-auto text-teal" />
                <p className="text-sm text-muted-foreground mt-3">No attendance recorded in this range. Mark attendance from <span className="font-medium">Teacher → Attendance</span> to see engagement trends.</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagement}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="class" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v: number, _n, p) => [`${v}% (${p.payload.records} records)`, "Attendance"]} />
                    <Bar dataKey="rate" fill="oklch(0.6 0.13 200)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          <div className="space-y-4">
            {[...groups.entries()].map(([k, list]) => (
              <Card key={k}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-xl">Class {k}</h2>
                  <span className="text-xs text-muted-foreground">{list.length} students</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {list.map((s) => (
                    <div key={s.id} className="rounded-xl border p-3 text-center">
                      {s.photo_url ? <img src={s.photo_url} alt="" className="h-12 w-12 rounded-full mx-auto object-cover" /> : <div className="h-12 w-12 rounded-full bg-secondary mx-auto grid place-items-center text-sm font-medium">{s.full_name.charAt(0)}</div>}
                      <div className="text-xs font-medium mt-2 truncate">{s.full_name}</div>
                      <div className="text-[10px] text-muted-foreground">{s.grade ?? ""}</div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
