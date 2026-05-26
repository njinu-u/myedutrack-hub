import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { lookupInvitationByToken, redeemInvitationByToken } from "@/lib/invitations.functions";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/accept-invite")({
  head: () => ({ meta: [{ title: "Accept invite — EduTrack" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s.token === "string" ? s.token : "" }),
  component: AcceptInvite,
});

type Inv = { role: string; email: string | null; name: string | null; school_name: string };

function AcceptInvite() {
  const { token } = useSearch({ from: "/accept-invite" });
  const navigate = useNavigate();
  const lookup = useServerFn(lookupInvitationByToken);
  const redeem = useServerFn(redeemInvitationByToken);

  const [loading, setLoading] = useState(true);
  const [inv, setInv] = useState<Inv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("Missing invite token"); setLoading(false); return; }
    (async () => {
      const res = await lookup({ data: { token } });
      if (res.ok) setInv(res.invitation);
      else setError(res.error);
      setLoading(false);
    })();
  }, [token, lookup]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    if (password.length < 8) { setSubmitErr("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setSubmitErr("Passwords do not match"); return; }
    setBusy(true);
    const res = await redeem({ data: { token, password } });
    if (!res.ok) { setSubmitErr(res.error); setBusy(false); return; }
    const { error: sErr } = await supabase.auth.signInWithPassword({ email: res.email, password });
    if (sErr) { setSubmitErr(sErr.message); setBusy(false); return; }
    navigate({ to: `/${res.role}` as "/teacher" });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-soft">
        <Link to="/" className="text-xs text-muted-foreground">← EduTrack</Link>

        {loading && (
          <div className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking your invite…
          </div>
        )}

        {!loading && error && (
          <div className="mt-4">
            <h1 className="font-display text-2xl">Invite not valid</h1>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm text-teal">
              Back to sign in <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {!loading && inv && (
          <>
            <div className="text-[10px] uppercase tracking-[0.25em] text-teal mt-3">Welcome to {inv.school_name}</div>
            <h1 className="font-display text-2xl mt-1">Set up your <span className="lowercase">{inv.role}</span> account</h1>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-3 rounded-lg bg-secondary px-3 py-2">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium truncate">{inv.name ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-3 rounded-lg bg-secondary px-3 py-2">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{inv.role}</span>
              </div>
              <div className="flex justify-between gap-3 rounded-lg bg-secondary px-3 py-2">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium truncate">{inv.email}</span>
              </div>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">New password (8+ chars)</span>
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Confirm password</span>
                <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" />
              </label>
              {submitErr && <div className="text-sm text-danger bg-danger/10 rounded-lg p-3">{submitErr}</div>}
              <button type="submit" disabled={busy}
                className="w-full py-2.5 rounded-full bg-navy text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {busy ? "Creating account…" : "Create my account"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
