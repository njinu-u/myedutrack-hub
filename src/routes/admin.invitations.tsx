import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import { listInvitations, createInvitation } from "@/lib/invitations.functions";
import { toast } from "sonner";
import { Copy, Loader2, Plus, Ticket } from "lucide-react";

export const Route = createFileRoute("/admin/invitations")({
  head: () => ({ meta: [{ title: "Invitations — EduTrack" }] }),
  component: Page,
});

const ROLES = ["teacher", "counselor", "parent", "student"] as const;
type R = typeof ROLES[number];

function Page() {
  const auth = useAuth();
  const qc = useQueryClient();
  const fetch = useServerFn(listInvitations);
  const create = useServerFn(createInvitation);
  const isReal = auth.isAuthed && !auth.isDemo;

  const q = useQuery({ queryKey: ["invitations"], queryFn: () => fetch(), enabled: isReal });
  const [role, setRole] = useState<R>("teacher");
  const [email, setEmail] = useState("");

  const m = useMutation({
    mutationFn: async () => create({ data: { role, email: email || null } }),
    onSuccess: (res) => {
      toast.success(`Invitation created: ${res.invitation.code}`);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = (code: string) => `${origin}/join/${code}`;
  const copy = async (text: string) => { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); };

  return (
    <div className="space-y-6">
      <PageHead title="Invitations" subtitle="Generate one-time codes so teachers, counselors, parents, and students can join your school." />

      {!isReal && (
        <Card>
          <div className="text-sm text-muted-foreground">Demo mode — sign in as a school admin to issue real invitations.</div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <h2 className="font-display text-xl flex items-center gap-2"><Plus className="h-4 w-4 text-teal" />New invitation</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (isReal) m.mutate(); else toast.info("Demo mode"); }} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as R)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Restrict to email (optional)</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.edu"
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" />
            </label>
            <button type="submit" disabled={m.isPending}
              className="w-full py-2.5 rounded-full bg-navy text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
              {m.isPending ? "Creating…" : "Generate code"}
            </button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-display text-xl flex items-center gap-2"><Ticket className="h-4 w-4 text-teal" />Active invitations</h2>
          {isReal && q.isLoading && <div className="mt-3 h-24 rounded-xl bg-secondary animate-pulse" />}
          {isReal && !q.isLoading && (q.data?.invitations.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground mt-4">No invitations yet.</p>
          )}
          <ul className="mt-3 space-y-2">
            {(q.data?.invitations ?? []).map((inv) => (
              <li key={inv.id} className="rounded-xl border p-3 flex items-center gap-3">
                <div className="font-mono text-lg tracking-wider">{inv.code}</div>
                <div className="flex-1 min-w-0 text-xs text-muted-foreground">
                  <div><span className="uppercase tracking-wider">{inv.role}</span>{inv.email ? ` · ${inv.email}` : ""}</div>
                  <div>{inv.used_at ? `Used ${new Date(inv.used_at).toLocaleDateString()}` : `Expires ${new Date(inv.expires_at).toLocaleDateString()}`}</div>
                </div>
                <button onClick={() => copy(inviteUrl(inv.code))} className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 inline-flex items-center gap-1.5">
                  <Copy className="h-3 w-3" /> Copy link
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
