import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHead, Card, Stat } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Loader2, CalendarCheck } from "lucide-react";

export const Route = createFileRoute("/admin/attendance")({
  head: () => ({ meta: [{ title: "Attendance — EduTrack" }] }),
  component: Page,
});

type Row = { id: string; date: string; status: "present" | "late" | "absent"; student_id: string; recorded_at: string };

function Page() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  useRealtimeInvalidate(["attendance"], [["admin-attendance"]]);

  const q = useQuery({
    queryKey: ["admin-attendance"],
    enabled: isReal,
    queryFn: async () => {
      const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("attendance")
        .select("id,date,status,student_id,recorded_at")
        .gte("date", since)
        .order("date", { ascending: false })
        .limit(1000);
      if (error) throw new Error(error.message);
      return (data ?? []) as Row[];
    },
  });

  const rows = q.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const todays = rows.filter((r) => r.date === today);
  const counts = (rs: Row[]) => ({
    present: rs.filter((r) => r.status === "present").length,
    late: rs.filter((r) => r.status === "late").length,
    absent: rs.filter((r) => r.status === "absent").length,
  });
  const t = counts(todays);
  const tot = t.present + t.late + t.absent;
  const rate = tot ? Math.round((t.present / tot) * 100) : 0;

  // Group by date
  const byDate = new Map<string, Row[]>();
  for (const r of rows) {
    const arr = byDate.get(r.date) ?? [];
    arr.push(r);
    byDate.set(r.date, arr);
  }

  return (
    <div className="space-y-6">
      <PageHead title="Attendance" subtitle="School-wide daily attendance from the live register." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in as admin to view live attendance.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && !q.isLoading && rows.length === 0 && (
        <Card className="text-center py-10">
          <CalendarCheck className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No attendance recorded yet. Teachers can take registers from <span className="font-medium">Teacher → Attendance</span>.</p>
        </Card>
      )}
      {isReal && rows.length > 0 && (
        <>
          <div className="grid sm:grid-cols-4 gap-3">
            <Stat label="Today rate" value={`${rate}%`} tone={rate >= 90 ? "good" : rate >= 75 ? "warn" : "bad"} />
            <Stat label="Present today" value={t.present} />
            <Stat label="Late today" value={t.late} tone="warn" />
            <Stat label="Absent today" value={t.absent} tone="bad" />
          </div>
          <Card>
            <h2 className="font-display text-xl">Last 14 days</h2>
            <table className="w-full text-sm mt-4">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                <tr><th className="text-left py-2">Date</th><th>Present</th><th>Late</th><th>Absent</th><th>Rate</th></tr>
              </thead>
              <tbody>
                {[...byDate.entries()].map(([date, rs]) => {
                  const c = counts(rs);
                  const total = c.present + c.late + c.absent;
                  const r = total ? Math.round((c.present / total) * 100) : 0;
                  return (
                    <tr key={date} className="border-b last:border-0">
                      <td className="py-2 font-medium">{date}</td>
                      <td className="text-center">{c.present}</td>
                      <td className="text-center text-amber">{c.late}</td>
                      <td className="text-center text-danger">{c.absent}</td>
                      <td className="text-center">{r}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
