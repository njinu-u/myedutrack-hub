import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Megaphone, Send } from "lucide-react";

export const Route = createFileRoute("/admin/communication")({
  head: () => ({ meta: [{ title: "Communication — EduTrack" }] }),
  component: Page,
});

type AppUser = { id: string; full_name: string | null; email: string; role: string };

const SEGMENTS = [
  { id: "all", label: "Everyone" },
  { id: "teacher", label: "Teachers" },
  { id: "counselor", label: "Counselors" },
  { id: "parent", label: "Parents" },
  { id: "student", label: "Students" },
] as const;

function Page() {
  const auth = useAuth();
  const qc = useQueryClient();
  const isReal = auth.isAuthed && !auth.isDemo;
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [seg, setSeg] = useState<typeof SEGMENTS[number]["id"]>("all");

  const users = useQuery({
    queryKey: ["school-users"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase.from("app_users").select("id,full_name,email,role");
      if (error) throw new Error(error.message);
      return (data ?? []) as AppUser[];
    },
  });

  const recent = useQuery({
    queryKey: ["broadcasts-sent"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id,subject,body,sent_at,to_user_id")
        .eq("from_user_id", auth.user!.id)
        .order("sent_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const targets = (users.data ?? []).filter((u) => u.id !== auth.user?.id && (seg === "all" ? true : u.role === seg));

  const send = useMutation({
    mutationFn: async () => {
      if (!auth.user || !auth.appUser?.school_id) throw new Error("Not signed in");
      if (!body.trim()) throw new Error("Message is required");
      if (targets.length === 0) throw new Error("No recipients in this segment");
      const rows = targets.map((u) => ({
        from_user_id: auth.user!.id,
        to_user_id: u.id,
        school_id: auth.appUser!.school_id!,
        subject: subject.trim() || null,
        body: body.trim(),
      }));
      const { error } = await supabase.from("messages").insert(rows);
      if (error) throw new Error(error.message);
      return rows.length;
    },
    onSuccess: (n) => {
      toast.success(`Broadcast sent to ${n} ${n === 1 ? "person" : "people"}`);
      setSubject(""); setBody("");
      qc.invalidateQueries({ queryKey: ["broadcasts-sent"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHead title="Communication" subtitle="Send announcements to your whole school or specific segments." />
      {!isReal && <Card><div className="text-sm text-muted-foreground">Demo mode — sign in as admin to send real broadcasts.</div></Card>}
      {isReal && (
        <>
          <Card>
            <h2 className="font-display text-xl flex items-center gap-2"><Megaphone className="h-4 w-4 text-teal" /> New broadcast</h2>
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {SEGMENTS.map((s) => (
                  <button key={s.id} onClick={() => setSeg(s.id)} className={`px-3 py-1.5 rounded-full text-xs ${seg === s.id ? "bg-navy text-white" : "bg-secondary"}`}>{s.label}</button>
                ))}
                <span className="ml-auto text-xs text-muted-foreground self-center">{targets.length} recipients</span>
              </div>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional)" className="w-full px-3 py-2 rounded-lg border bg-card text-sm" />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Your message…" className="w-full px-3 py-2 rounded-lg border bg-card text-sm resize-none" />
              <button onClick={() => send.mutate()} disabled={send.isPending || !body.trim()} className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-50">
                {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send broadcast
              </button>
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-xl">Recently sent</h2>
            {recent.isLoading && <Loader2 className="h-4 w-4 animate-spin mt-3" />}
            {!recent.isLoading && (recent.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground mt-3">You haven't sent any broadcasts yet.</p>
            )}
            <ul className="mt-3 space-y-2">
              {(recent.data ?? []).slice(0, 10).map((m) => (
                <li key={m.id} className="rounded-xl border p-3">
                  <div className="text-xs text-muted-foreground">{new Date(m.sent_at).toLocaleString()}</div>
                  {m.subject && <div className="font-medium text-sm mt-0.5">{m.subject}</div>}
                  <div className="text-sm mt-1 line-clamp-2">{m.body}</div>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
