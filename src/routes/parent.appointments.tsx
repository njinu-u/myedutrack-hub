import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/parent/appointments")({ component: Appointments });

const SLOTS = ["Mon 14:00","Mon 15:30","Tue 09:00","Wed 16:00","Thu 13:30","Fri 10:00"];

function Appointments() {
  const auth = useAuth();
  if (auth.isAuthed) return <LiveAppointments />;
  return <DemoAppointments />;
}

function LiveAppointments() {
  const auth = useAuth();
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

  return (
    <div className="space-y-6">
      <PageHead title="Appointments" subtitle="Your parent-teacher appointment requests." />
      {q.isLoading ? (
        <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>
      ) : (q.data ?? []).length === 0 ? (
        <Card className="text-center py-14">
          <CalendarClock className="h-7 w-7 mx-auto text-teal" />
          <div className="font-display text-xl mt-3">No appointment requests yet</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Use Messages to contact your child's teacher and agree a meeting time.</p>
        </Card>
      ) : (
        <Card>
          <ul className="space-y-2">
            {(q.data ?? []).map((a) => (
              <li key={a.id} className="rounded-xl border p-3">
                <div className="text-sm font-medium">{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : "Time not scheduled yet"}</div>
                <div className="text-xs text-muted-foreground mt-1">Status: {a.status}</div>
                {a.notes && <div className="text-sm mt-2">{a.notes}</div>}
              </li>
            ))}
          </ul>
        </Card>
      )}
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
