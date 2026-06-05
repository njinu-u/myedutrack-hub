import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHead } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/counselor/risk")({
  head: () => ({ meta: [{ title: "Risk Reports — EduTrack" }] }),
  component: Risk,
});

type Flag = { id: string; student_id: string; reason: string; severity: "low" | "medium" | "high"; created_at: string; resolved_at: string | null };
type Student = { id: string; full_name: string; grade: string | null };

function Risk() {
  const auth = useAuth();
  const isReal = auth.isAuthed && !auth.isDemo;
  useRealtimeInvalidate(["counselor_flags"], [["counselor-risk"]]);

  const q = useQuery({
    queryKey: ["counselor-risk"],
    enabled: isReal,
    queryFn: async () => {
      const [{ data: flags }, { data: students }] = await Promise.all([
        supabase.from("counselor_flags").select("id,student_id,reason,severity,created_at,resolved_at").is("resolved_at", null).order("created_at", { ascending: false }),
        supabase.from("students").select("id,full_name,grade"),
      ]);
      return { flags: (flags ?? []) as Flag[], students: (students ?? []) as Student[] };
    },
  });

  const sMap = new Map((q.data?.students ?? []).map((s) => [s.id, s]));
  const flags = q.data?.flags ?? [];

  return (
    <div className="space-y-6">
      <PageHead title="Risk Reports" subtitle="Active wellbeing flags ranked by severity." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Sign in as counselor to view risk reports.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && !q.isLoading && flags.length === 0 && (
        <Card className="text-center py-10">
          <ShieldAlert className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No active risk flags. Raise one from <span className="font-medium">Interventions</span>.</p>
        </Card>
      )}
      {isReal && flags.length > 0 && (
        <Card>
          <ul className="space-y-2">
            {[...flags].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : b.severity === "high" ? 1 : a.severity === "medium" ? -1 : 1)).map((f) => {
              const s = sMap.get(f.student_id);
              return (
                <li key={f.id} className="rounded-xl border p-3 flex items-start gap-3">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${f.severity === "high" ? "bg-danger/15 text-danger" : f.severity === "medium" ? "bg-amber/15 text-amber" : "bg-secondary"}`}>{f.severity}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{s?.full_name ?? "Student"} {s?.grade && <span className="text-xs text-muted-foreground">· {s.grade}</span>}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{f.reason}</div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(f.created_at).toLocaleString()}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
