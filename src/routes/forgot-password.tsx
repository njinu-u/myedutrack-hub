import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset your password — EduTrack" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) { setErr(error.message); setBusy(false); return; }
    setSent(true);
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-soft">
        <Link to="/login" className="text-xs text-muted-foreground">← Back to sign in</Link>
        <h1 className="font-display text-2xl mt-3">Reset your password</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your account email and we'll send a reset link.</p>

        {sent ? (
          <div className="mt-6 rounded-xl bg-success/10 text-success p-4 text-sm flex items-start gap-3">
            <MailCheck className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">Check your email</div>
              <div className="text-success/80 mt-1">If an account exists for {email}, a password reset link is on its way. The link is valid for one hour.</div>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </label>
            {err && <div className="text-sm text-danger bg-danger/10 rounded-lg p-3">{err}</div>}
            <button type="submit" disabled={busy}
              className="w-full py-2.5 rounded-full bg-navy text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
