import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Loader2, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { listSchoolUsers } from "@/lib/messages.functions";
import { bookAppointment } from "@/lib/interactions.functions";

export const Route = createFileRoute("/parent/appointments")({ component: Appointments });

const SLOTS = ["Mon 14:00","Mon 15:30","Tue 09:00","Wed 16:00","Thu 13:30","Fri 10:00"];

function Appointments() {
  const auth = useAuth();
  if (auth.isAuthed && !auth.isDemo) return <LiveAppointments />;
  return <DemoAppointments />;
}

function LiveAppointments() {
  const auth = useAuth();
  const qc = useQueryClient();
  const fetchStaff = useServerFn(listSchoolUsers);
  const book = useServerFn(bookAppointment);
  const studentId = auth.appUser?.linked_student_id ?? null;

  const [teacherId, setTeacherId] = useState<string>("");
  const [when, setWhen] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const staff = useQuery({
    queryKey: ["parent-staff"],
    queryFn: () => fetchStaff(),
    enabled: auth.isAuthed,
  });

  const q = useQuery({
    queryKey: ["parent-appointments", auth.user?.id],
    enabled: !!auth.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id,scheduled_at,status,notes,requested_at")
        .eq("parent_user_id", auth.user!.id)
        .order("requested_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const bookMut = useMutation({
    mutationFn: () =>
      book({
        data: {
          teacher_user_id: teacherId,
          student_id: studentId!,
          scheduled_at: new Date(when).toISOString(),
          notes: notes.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Appointment requested");
      setTeacherId(""); setWhen(""); setNotes("");
      qc.invalidateQueries({ queryKey: ["parent-appointments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canBook = !!studentId && !!teacherId && !!when;

  return (
    <div className="space-y-6">
      <PageHead title="Appointments" subtitle="Request a meeting with your child's teacher or counselor." />

      <Card>
        <h2 className="font-display text-xl mb-3">Book an appointment</h2>
        {!studentId ? (
          <div className="text-sm text-muted-foreground">
            Your account isn't linked to a student yet. Please contact your school admin.
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (canBook) bookMut.mutate(); }}
            className="grid sm:grid-cols-2 gap-3"
          >
            <div className="sm:col-span-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Teacher / Counselor</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm"
              >
                <option value="">{staff.isLoading ? "Loading…" : "Select a staff member"}</option>
                {(staff.data?.users ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {(u.full_name ?? "Staff")} · {u.role}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Date & time</label>
              <input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What would you like to discuss?"
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={!canBook || bookMut.isPending}
                className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex gap-2 items-center disabled:opacity-50"
              >
                {bookMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Request appointment
              </button>
            </div>
          </form>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-xl mb-3">Your requests</h2>
        {q.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-teal" />
        ) : (q.data ?? []).length === 0 ? (
          <div className="text-center py-10">
            <CalendarClock className="h-7 w-7 mx-auto text-teal" />
            <div className="font-display text-lg mt-3">No appointment requests yet</div>
            <p className="text-sm text-muted-foreground mt-1">Use the form above to request your first meeting.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {(q.data ?? []).map((a) => (
              <li key={a.id} className="rounded-xl border p-3">
                <div className="text-sm font-medium">{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : "Time not scheduled yet"}</div>
                <div className="text-xs text-muted-foreground mt-1">Status: {a.status}</div>
                {a.notes && <div className="text-sm mt-2">{a.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function DemoAppointments() {
  const [requested, setRequested] = useState<string | null>(null);

  const book = (slot: string) => {
    setRequested(slot);
    toast.success(`Appointment requested · ${slot}`);
  };

  return (
    <div className="space-y-6">
      <PageHead title="Book an appointment" subtitle="Reserve a parent-teacher conference slot." />
      <Card>
        <h2 className="font-display text-xl">Available slots this week</h2>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          {SLOTS.map((s) => {
            const active = requested === s;
            return (
              <button key={s} onClick={() => book(s)}
                className={`p-4 rounded-xl border transition text-left ${active ? "border-[oklch(0.7_0.13_35)] bg-[oklch(0.7_0.13_35)]/10" : "hover:border-[oklch(0.7_0.13_35)] hover:bg-[oklch(0.7_0.13_35)]/5"}`}>
                <div className="font-display text-lg">{s}</div>
                <div className="text-xs text-muted-foreground">20 min{active ? " · requested" : ""}</div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
