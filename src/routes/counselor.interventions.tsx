import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, ShieldAlert, Plus, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/counselor/interventions")({
  head: () => ({ meta: [{ title: "Interventions — EduTrack" }] }),
  component: Page,
});

type Flag = { id: string; student_id: string; reason: string; severity: "low" | "medium" | "high"; created_at: string; resolved_at: string | null };
type Student = { id: string; full_name: string };

function Page() {
  const auth = useAuth();
  const qc = useQueryClient();
  const isReal = auth.isAuthed && !auth.isDemo;
  useRealtimeInvalidate(["counselor_flags"], [["counselor-interventions"]]);

  const flags = useQuery({
    queryKey: ["counselor-interventions"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counselor_flags")
        .select("id,student_id,reason,severity,created_at,resolved_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return (data ?? []) as Flag[];
    },
  });

  const students = useQuery({
    queryKey: ["counselor-students-min"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id,full_name").order("full_name");
      if (error) throw new Error(error.message);
      return (data ?? []) as Student[];
    },
  });
  const sMap = new Map((students.data ?? []).map((s) => [s.id, s.full_name]));

  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<Flag["severity"]>("medium");

  const create = useMutation({
    mutationFn: async () => {
      if (!auth.appUser?.school_id) throw new Error("Not signed in");
      if (!studentId) throw new Error("Pick a student");
      if (reason.trim().length < 3) throw new Error("Reason is required");
      const { error } = await supabase.from("counselor_flags").insert({
        school_id: auth.appUser.school_id, student_id: studentId, reason: reason.trim(),
        severity, flagged_by: auth.user!.id,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { toast.success("Intervention logged"); setOpen(false); setReason(""); setStudentId(""); qc.invalidateQueries({ queryKey: ["counselor-interventions"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("counselor_flags").update({ resolved_at: new Date().toISOString() }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { toast.success("Marked resolved"); qc.invalidateQueries({ queryKey: ["counselor-interventions"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const active = (flags.data ?? []).filter((f) => !f.resolved_at);
  const closed = (flags.data ?? []).filter((f) => f.resolved_at);

  return (
    <div className="space-y-6">
      <PageHead title="Intervention Tracker" subtitle="Plan, log, and resolve every support intervention." actions={
        isReal ? <button onClick={() => setOpen(true)} className="px-3 h-9 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2"><Plus className="h-3.5 w-3.5" /> New intervention</button> : null
      } />

      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in as counselor to manage interventions.</div></Card>}
      {isReal && flags.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && !flags.isLoading && (flags.data ?? []).length === 0 && (
        <Card className="text-center py-10">
          <ShieldAlert className="h-6 w-6 mx-auto text-amber" />
          <p className="text-sm text-muted-foreground mt-3">No interventions yet. Click <span className="font-medium">New intervention</span> to log one.</p>
        </Card>
      )}

      {isReal && active.length > 0 && (
        <Card>
          <h2 className="font-display text-xl">Active</h2>
          <ul className="mt-3 space-y-2">
            {active.map((f) => (
              <li key={f.id} className="rounded-xl border p-3 flex items-start gap-3">
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${f.severity === "high" ? "bg-danger/15 text-danger" : f.severity === "medium" ? "bg-amber/15 text-amber" : "bg-secondary"}`}>{f.severity}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{sMap.get(f.student_id) ?? "Student"}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{f.reason}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(f.created_at).toLocaleString()}</div>
                </div>
                <button onClick={() => resolve.mutate(f.id)} disabled={resolve.isPending} className="px-3 py-1.5 rounded-full bg-secondary text-xs inline-flex items-center gap-1.5 disabled:opacity-50">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isReal && closed.length > 0 && (
        <Card>
          <h2 className="font-display text-xl">Resolved</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {closed.slice(0, 20).map((f) => (
              <li key={f.id} className="rounded-xl border p-3 opacity-75">
                <div className="font-medium">{sMap.get(f.student_id) ?? "Student"}</div>
                <div className="text-muted-foreground">{f.reason}</div>
                <div className="text-xs text-muted-foreground mt-1">Resolved {new Date(f.resolved_at!).toLocaleDateString()}</div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New intervention</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Student</span>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm">
                <option value="">Select…</option>
                {(students.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Severity</span>
              <select value={severity} onChange={(e) => setSeverity(e.target.value as Flag["severity"])} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </label>
            <label className="block"><span className="text-xs uppercase tracking-wider text-muted-foreground">Reason / plan</span>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm resize-none" />
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-3 py-2 rounded-full bg-secondary text-sm">Cancel</button>
            <button onClick={() => create.mutate()} disabled={create.isPending} className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-50">
              {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Log intervention
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
