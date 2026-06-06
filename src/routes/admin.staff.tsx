import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHead, Card } from "@/components/portal-layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { createInvitation, listInvitations } from "@/lib/invitations.functions";
import { adminDeleteUser } from "@/lib/account.functions";
import { buildInviteEmail, openGmailCompose, buildInviteUrl, type InviteRole } from "@/lib/gmail-compose";
import { toast } from "sonner";
import { GraduationCap, HeartHandshake, Loader2, Mail, Plus, UserCheck, Trash2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/staff")({
  head: () => ({ meta: [{ title: "Staff — EduTrack" }] }),
  component: StaffPage,
});

type StaffMember = { id: string; full_name: string | null; email: string; role: string };

function StaffPage() {
  const auth = useAuth();
  const qc = useQueryClient();
  const isReal = auth.isAuthed && !auth.isDemo;

  const fetchInvitations = useServerFn(listInvitations);
  const create = useServerFn(createInvitation);
  const removeUser = useServerFn(adminDeleteUser);
  const [confirmRemove, setConfirmRemove] = useState<StaffMember | null>(null);

  const removeMut = useMutation({
    mutationFn: (id: string) => removeUser({ data: { user_id: id } }),
    onSuccess: () => { toast.success("Staff account deleted"); setConfirmRemove(null); qc.invalidateQueries({ queryKey: ["admin-staff"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const staffQuery = useQuery({
    queryKey: ["admin-staff"],
    enabled: isReal,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_users")
        .select("id,full_name,email,role")
        .in("role", ["teacher", "counselor", "school_admin"])
        .order("role", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as StaffMember[];
    },
  });

  const invitesQuery = useQuery({ queryKey: ["invitations"], queryFn: () => fetchInvitations(), enabled: isReal });

  const [open, setOpen] = useState<null | InviteRole>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const createMut = useMutation({
    mutationFn: async () => create({ data: { role: open!, name: name.trim(), email: email.trim() } }),
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
      setOpen(null); setName(""); setEmail("");
      qc.invalidateQueries({ queryKey: ["invitations"] });
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pendingByRole = useMemo(() => {
    const list = (invitesQuery.data?.invitations ?? []).filter((i) => i.status === "pending");
    return { teacher: list.filter((i) => i.role === "teacher"), counselor: list.filter((i) => i.role === "counselor") };
  }, [invitesQuery.data]);

  const submitInvite = () => {
    if (!isReal) { toast.info("Sign in as admin to send invitations"); return; }
    if (!name.trim() || !email.trim()) { toast.error("Name and email are required"); return; }
    createMut.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Staff"
        subtitle="Manage teachers, counselors, and admin staff."
        actions={
          <>
            <button onClick={() => { setOpen("teacher"); }} className="px-3 h-9 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5" /> Invite Teacher
            </button>
            <button onClick={() => { setOpen("counselor"); }} className="px-3 h-9 rounded-full bg-secondary text-sm inline-flex items-center gap-2">
              <HeartHandshake className="h-3.5 w-3.5" /> Invite Counselor
            </button>
            <Link to="/admin/invitations" className="px-3 h-9 rounded-full border text-sm inline-flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" /> All invitations
            </Link>
          </>
        }
      />

      <Card>
        <h2 className="font-display text-xl flex items-center gap-2"><UserCheck className="h-4 w-4 text-teal" /> Roster</h2>

        {!isReal && (
          <div className="mt-3 text-sm text-muted-foreground">Demo mode — sign in to manage real staff.</div>
        )}

        {isReal && staffQuery.isLoading && <div className="mt-4 h-24 rounded-xl bg-secondary animate-pulse" />}
        {isReal && !staffQuery.isLoading && (staffQuery.data ?? []).length === 0 && (
          <div className="mt-6 text-sm text-muted-foreground text-center py-10 border border-dashed rounded-xl">
            No staff yet. Use “Invite Teacher” or “Invite Counselor” above to get started.
          </div>
        )}
        {isReal && (staffQuery.data ?? []).length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                <tr><th className="text-left py-3 font-medium">Name</th><th className="text-left py-3 font-medium">Email</th><th className="text-left py-3 font-medium">Role</th><th className="text-right py-3 font-medium">Actions</th></tr>
              </thead>
              <tbody>
                {(staffQuery.data ?? []).map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-3">{m.full_name ?? "—"}</td>
                    <td className="text-muted-foreground">{m.email}</td>
                    <td><span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary">{m.role.replace("_", " ")}</span></td>
                    <td className="text-right">
                      {m.id !== auth.user?.id && (
                        <button onClick={() => setConfirmRemove(m)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-danger/10 text-muted-foreground hover:text-danger transition"
                          aria-label={`Delete ${m.full_name ?? m.email}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {isReal && (pendingByRole.teacher.length + pendingByRole.counselor.length > 0) && (
        <Card>
          <h2 className="font-display text-xl flex items-center gap-2"><Mail className="h-4 w-4 text-amber" /> Pending invitations</h2>
          <ul className="mt-3 space-y-2">
            {[...pendingByRole.teacher, ...pendingByRole.counselor].map((i) => (
              <li key={i.id} className="rounded-xl border p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{i.name ?? i.email}</div>
                  <div className="text-xs text-muted-foreground"><span className="uppercase tracking-wider">{i.role}</span> · {i.email} · expires {new Date(i.expires_at).toLocaleDateString()}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-amber/15 text-amber">Pending</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-muted-foreground">
            Manage, resend or cancel any pending invite from <Link to="/admin/invitations" className="text-teal underline">Invitations</Link>.
          </div>
        </Card>
      )}

      <Dialog open={open !== null} onOpenChange={(o) => { if (!o) setOpen(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite {open === "counselor" ? "Counselor" : "Teacher"}</DialogTitle>
            <DialogDescription>We’ll save the invite and open a Gmail compose tab so it sends from your address.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Full name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" />
            </label>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(null)} className="px-3 py-2 rounded-full bg-secondary text-sm">Cancel</button>
            <button onClick={submitInvite} disabled={createMut.isPending}
              className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-50">
              {createMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Send invitation
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRemove !== null} onOpenChange={(o) => !removeMut.isPending && !o && setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-danger" /> Delete this account?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <b>{confirmRemove?.full_name ?? confirmRemove?.email}</b>? This action cannot be undone — the user's profile and sign-in will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setConfirmRemove(null)} disabled={removeMut.isPending} className="px-3 py-2 rounded-full bg-secondary text-sm">Cancel</button>
            <button onClick={() => confirmRemove && removeMut.mutate(confirmRemove.id)} disabled={removeMut.isPending}
              className="px-4 py-2 rounded-full bg-danger text-white text-sm inline-flex items-center gap-2 disabled:opacity-60">
              {removeMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Yes, delete account
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
