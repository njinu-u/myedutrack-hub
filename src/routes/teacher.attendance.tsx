import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAttendanceForDate, markAttendance } from "@/lib/attendance.functions";
import { getMyTeacherAssignments } from "@/lib/assignments.functions";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildClassLabelSet, matchesAnyClass, studentClassCandidates } from "@/lib/class-label";

export const Route = createFileRoute("/teacher/attendance")({ component: TeacherAttendance });

type Status = "present" | "absent" | "late";

function TeacherAttendance() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  if (!isReal) {
    return (
      <div className="space-y-6">
        <PageHead title="Attendance" subtitle="Quick register — one tap per student. Works offline." />
        <Card>
          <div className="text-sm text-muted-foreground">
            Demo preview. Sign in to mark attendance against your real student roster — taps save instantly with offline sync.
          </div>
        </Card>
      </div>
    );
  }

  return <RealRegister date={date} setDate={setDate} />;
}

function RealRegister({ date, setDate }: { date: string; setDate: (d: string) => void }) {
  const qc = useQueryClient();
  const fetchRows = useServerFn(listAttendanceForDate);
  const mark = useServerFn(markAttendance);
  const [savingId, setSavingId] = useState<string | null>(null);

  useRealtimeInvalidate(["attendance"], [["attendance-day", date]]);

  const q = useQuery({
    queryKey: ["attendance-day", date],
    queryFn: () => fetchRows({ data: { date } }),
  });

  const setStatus = async (student_id: string, status: Status) => {
    setSavingId(student_id);
    try {
      await mark({ data: { student_id, date, status } });
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["attendance-day", date] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const rows = q.data?.rows ?? [];

  return (
    <div className="space-y-6">
      <PageHead
        title="Attendance"
        subtitle="One tap per student. Saves instantly."
        actions={
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 h-9 rounded-full border bg-card text-sm"
          />
        }
      />
      <Card>
        {q.isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No students yet. Add students from Admin → Students to start marking attendance.
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.student_id} className="py-3 flex items-center gap-3">
                <img
                  src={r.photo_url ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.full_name)}`}
                  className="h-9 w-9 rounded-full object-cover"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.full_name}</div>
                  <div className="text-xs text-muted-foreground">{r.grade ?? "—"} · {r.class_id ?? "—"}</div>
                </div>
                {savingId === r.student_id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <div className="flex gap-1.5">
                  {(["present", "late", "absent"] as Status[]).map((s) => {
                    const active = r.status === s;
                    const tone =
                      s === "present" ? "bg-success/15 text-success border-success/30" :
                      s === "late" ? "bg-amber/15 text-amber border-amber/30" :
                      "bg-danger/15 text-danger border-danger/30";
                    const Icon = s === "present" ? Check : s === "late" ? Clock : X;
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(r.student_id, s)}
                        disabled={savingId !== null}
                        className={cn(
                          "h-8 w-8 grid place-items-center rounded-full border text-xs disabled:opacity-50",
                          active ? tone : "bg-card text-muted-foreground hover:bg-secondary",
                        )}
                        aria-label={s}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
