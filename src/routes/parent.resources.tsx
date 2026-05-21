import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Bell, Check } from "lucide-react";

export const Route = createFileRoute("/parent/resources")({
  head: () => ({ meta: [{ title: "Resources — EduTrack" }] }),
  component: Page,
});

type Notif = { id: string; type: string; message: string; link: string | null; read_at: string | null; created_at: string };

function Page() {
  const auth = useAuth();
  const qc = useQueryClient();
  const isReal = auth.isAuthed && !auth.isDemo;

  const q = useQuery({
    queryKey: ["parent-notifications"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,message,link,read_at,created_at")
        .eq("to_user_id", auth.user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return (data ?? []) as Notif[];
    },
  });

  const mark = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parent-notifications"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).eq("to_user_id", auth.user!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { toast.success("All marked as read"); qc.invalidateQueries({ queryKey: ["parent-notifications"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = q.data ?? [];
  const unread = rows.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <PageHead title="Updates & Resources" subtitle="School announcements, alerts, and resources for your family." actions={
        isReal && unread > 0 ? <button onClick={() => markAll.mutate()} disabled={markAll.isPending} className="px-3 h-9 rounded-full bg-secondary text-sm inline-flex items-center gap-2 disabled:opacity-50">
          {markAll.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Mark all read
        </button> : null
      } />

      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in as parent to see your school updates.</div></Card>}
      {isReal && q.isLoading && <Card><Loader2 className="h-5 w-5 animate-spin text-teal" /></Card>}
      {isReal && !q.isLoading && rows.length === 0 && (
        <Card className="text-center py-10">
          <Bell className="h-6 w-6 mx-auto text-teal" />
          <p className="text-sm text-muted-foreground mt-3">No updates yet. Your school will post announcements and alerts here.</p>
        </Card>
      )}
      {isReal && rows.length > 0 && (
        <Card>
          <ul className="space-y-2">
            {rows.map((n) => (
              <li key={n.id} className={`rounded-xl border p-3 flex items-start gap-3 ${!n.read_at ? "bg-secondary/40" : ""}`}>
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary mt-0.5">{n.type}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{n.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.read_at && (
                  <button onClick={() => mark.mutate(n.id)} className="px-2 py-1 rounded-full bg-secondary text-xs inline-flex items-center gap-1"><Check className="h-3 w-3" /> Read</button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
