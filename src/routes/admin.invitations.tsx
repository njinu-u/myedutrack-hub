import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { useAuth } from "@/lib/auth";
import {
  listInvitations,
  createInvitation,
  resendInvitation,
  cancelInvitation,
} from "@/lib/invitations.functions";
import {
  buildInviteEmail,
  openGmailCompose,
  copyInviteLink,
  buildInviteUrl,
  type InviteRole,
} from "@/lib/gmail-compose";
import { toast } from "sonner";
import { Copy, Loader2, Mail, Plus, RotateCw, Ticket, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/invitations")({
  head: () => ({ meta: [{ title: "Invitations — EduTrack" }] }),
  component: Page,
});

const ROLES: InviteRole[] = ["teacher", "counselor", "parent", "student"];

function Page() {
  const auth = useAuth();
  const qc = useQueryClient();
  const fetchList = useServerFn(listInvitations);
  const create = useServerFn(createInvitation);
  const resend = useServerFn(resendInvitation);
  const cancel = useServerFn(cancelInvitation);
  const isReal = auth.isAuthed && !auth.isDemo;

  const q = useQuery({ queryKey: ["invitations"], queryFn: () => fetchList(), enabled: isReal });

  const [role, setRole] = useState<InviteRole>("teacher");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "accepted">("all");

  const createMut = useMutation({
    mutationFn: async () => create({ data: { role, name: name.trim(), email: email.trim() } }),
    onSuccess: (res) => {
      const url = buildInviteUrl(res.invitation.token);
      const { subject, body } = buildInviteEmail({
        role: res.invitation.role as InviteRole,
        recipient_name: res.invitation.name ?? "there",
        recipient_email: res.invitation.email!,
        school_name: res.school_name,
        admin_name: res.admin_name,
        invite_url: url,
      });
      toast.success("Opening Gmail to send your invitation…");
      setTimeout(() => openGmailCompose({ to: res.invitation.email!, subject, body }), 800);
      toast("Invitation saved. Please send the email that just opened in Gmail.", { duration: 6000 });
      setName(""); setEmail("");
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resendMut = useMutation({
    mutationFn: async (id: string) => resend({ data: { id } }),
    onSuccess: (res) => {
      const url = buildInviteUrl(res.invitation.token);
      const { subject, body } = buildInviteEmail({
        role: res.invitation.role as InviteRole,
        recipient_name: res.invitation.name ?? "there",
        recipient_email: res.invitation.email!,
        school_name: res.school_name,
        admin_name: res.admin_name,
        invite_url: url,
      });
      openGmailCompose({ to: res.invitation.email!, subject, body });
      toast.success("Gmail compose opened with the same invite link");
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMut = useMutation({
    mutationFn: async (id: string) => cancel({ data: { id } }),
    onSuccess: () => { toast.success("Invitation cancelled"); qc.invalidateQueries({ queryKey: ["invitations"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const list = q.data?.invitations ?? [];
    if (filter === "all") return list;
    return list.filter((i) => i.status === filter);
  }, [q.data, filter]);

  return (
    <div className="space-y-6">
      <PageHead title="Invitations" subtitle="Invite teachers, counselors, parents and students. Emails open in your own Gmail tab." />

      {!isReal && (
        <Card>
          <div className="text-sm text-muted-foreground">Demo mode — sign in as a school admin to issue real invitations.</div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <h2 className="font-display text-xl flex items-center gap-2"><Plus className="h-4 w-4 text-teal" />New invitation</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isReal) { toast.info("Sign in as admin to send invitations"); return; }
              if (!name.trim() || !email.trim()) { toast.error("Name and email are required"); return; }
              createMut.mutate();
            }}
            className="mt-4 space-y-3"
          >
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as InviteRole)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Full name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ms. Adaeze Odhiambo"
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@school.edu"
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" />
            </label>
            <button type="submit" disabled={createMut.isPending}
              className="w-full py-2.5 rounded-full bg-navy text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {createMut.isPending ? "Saving…" : "Send invitation"}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              Email opens in a new Gmail tab — you send it from your own address.
            </p>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl flex items-center gap-2"><Ticket className="h-4 w-4 text-teal" />Invitations</h2>
            <div className="inline-flex rounded-full bg-secondary p-1 text-xs">
              {(["all", "pending", "accepted"] as const).map((k) => (
                <button key={k} onClick={() => setFilter(k)}
                  className={`px-3 py-1 rounded-full capitalize ${filter === k ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                  {k}
                </button>
              ))}
            </div>
          </div>

          {isReal && q.isLoading && <div className="mt-3 h-24 rounded-xl bg-secondary animate-pulse" />}
          {isReal && !q.isLoading && filtered.length === 0 && (
            <div className="mt-6 text-sm text-muted-foreground text-center py-10 border border-dashed rounded-xl">
              No invitations to show. Use the form on the left to invite your first staff member or family.
            </div>
          )}

          <ul className="mt-3 space-y-2">
            {filtered.map((inv) => {
              const url = buildInviteUrl(inv.token);
              const isAccepted = inv.status === "accepted" || !!inv.used_at;
              return (
                <li key={inv.id} className="rounded-xl border p-3 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{inv.name ?? inv.email}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="uppercase tracking-wider">{inv.role}</span>
                      {inv.email ? ` · ${inv.email}` : ""} ·{" "}
                      {isAccepted
                        ? `Accepted ${inv.used_at ? new Date(inv.used_at).toLocaleDateString() : ""}`
                        : `Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${
                    isAccepted ? "bg-success/15 text-success" : "bg-amber/15 text-amber"
                  }`}>
                    {isAccepted ? "Accepted" : "Pending"}
                  </span>
                  {!isAccepted && (
                    <>
                      <button onClick={() => copyInviteLink(url)} className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 inline-flex items-center gap-1.5">
                        <Copy className="h-3 w-3" /> Copy link
                      </button>
                      <button
                        disabled={resendMut.isPending}
                        onClick={() => resendMut.mutate(inv.id)}
                        className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 inline-flex items-center gap-1.5 disabled:opacity-50">
                        <RotateCw className="h-3 w-3" /> Resend
                      </button>
                      <button
                        disabled={cancelMut.isPending}
                        onClick={() => { if (confirm("Cancel this invitation?")) cancelMut.mutate(inv.id); }}
                        className="text-xs px-3 py-1.5 rounded-full bg-danger/10 text-danger hover:bg-danger/15 inline-flex items-center gap-1.5 disabled:opacity-50">
                        <Trash2 className="h-3 w-3" /> Cancel
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
