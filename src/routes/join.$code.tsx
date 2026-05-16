import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { lookupInvitation, redeemInvitation } from "@/lib/invitations.functions";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/join/$code")({
  head: () => ({ meta: [{ title: "Join your school — EduTrack" }] }),
  component: Join,
});

function Join() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const lookup = useServerFn(lookupInvitation);
  const redeem = useServerFn(redeemInvitation);

  const [state, setState] = useState<{ loading: boolean; ok: boolean; error?: string; role?: string; email?: string | null; school?: string }>({ loading: true, ok: false });
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await lookup({ data: { code } });
      if (res.ok) {
        setState({ loading: false, ok: true, role: res.invitation.role, email: res.invitation.email, school: res.invitation.school_name });
        if (res.invitation.email) setForm((f) => ({ ...f, email: res.invitation.email! }));
      } else {
        setState({ loading: false, ok: false, error: res.error });
      }
    })();
  }, [code, lookup]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    const res = await redeem({ data: { code, ...form } });
    if (!res.ok) { setErr(res.error); setBusy(false); return; }
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) { setErr(error.message); setBusy(false); return; }
    navigate({ to: `/${res.role}` as "/teacher" });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-soft">
        <Link to="/" className="text-xs text-muted-foreground">← EduTrack</Link>
        {state.loading && <div className="mt-6 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking invitation…</div>}
        {!state.loading && !state.ok && (
          <div className="mt-4">
            <h1 className="font-display text-2xl">Invitation not valid</h1>
            <p className="text-sm text-muted-foreground mt-2">{state.error}</p>
            <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm text-teal">Back to sign in <ArrowRight className="h-3 w-3" /></Link>
          </div>
        )}
        {!state.loading && state.ok && (
          <>
            <div className="text-[10px] uppercase tracking-[0.25em] text-teal mt-3">Join {state.school}</div>
            <h1 className="font-display text-2xl mt-1">Create your <span className="lowercase">{state.role}</span> account</h1>
            <form onSubmit={submit} className="mt-5 space-y-3">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Full name</span>
                <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!state.email}
                  className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm disabled:opacity-70" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Password (8+ chars)</span>
                <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm" />
              </label>
              {err && <div className="text-sm text-danger bg-danger/10 rounded-lg p-3">{err}</div>}
              <button type="submit" disabled={busy}
                className="w-full py-2.5 rounded-full bg-navy text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {busy ? "Creating account…" : "Join school"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
