import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Bell, Check, Loader2 } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — EduTrack" }] }),
  component: NotificationsPage,
});

type Notif = { id: string; type: string; message: string; link: string | null; read_at: string | null; created_at: string };

function NotificationsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthed) navigate({ to: "/login" });
  }, [auth.loading, auth.isAuthed, navigate]);

  const q = useQuery({
    queryKey: ["notifications", auth.user?.id],
    enabled: !!auth.user?.id,
    queryFn: async (): Promise<Notif[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,message,link,read_at,created_at")
        .eq("to_user_id", auth.user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Notif[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("to_user_id", auth.user!.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const portalHome = (() => {
    switch (auth.appUser?.role) {
      case "school_admin": return "/admin";
      case "teacher": return "/teacher";
      case "counselor": return "/counselor";
      case "parent": return "/parent";
      case "student": return "/student";
      default: return "/";
    }
  })();

  const notifs = q.data ?? [];
  const unread = notifs.filter((n) => !n.read_at).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to={portalHome} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-1">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
          </div>
          {unread > 0 && (
            <button onClick={() => markAllRead.mutate()} className="text-sm text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>

        {q.isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : notifs.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border/70 p-12 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
            No notifications yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {notifs.map((n) => (
              <li key={n.id} className={`rounded-xl border border-border/70 p-4 flex items-start gap-3 ${n.read_at ? "bg-card" : "bg-primary/5 border-primary/20"}`}>
                <div className="h-8 w-8 rounded-full bg-secondary grid place-items-center shrink-0">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{n.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.read_at && (
                  <button onClick={() => markRead.mutate(n.id)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
