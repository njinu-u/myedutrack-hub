import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set a new password — EduTrack" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase places a session in the URL hash on recovery links; the client
    // picks it up automatically. Just confirm we have a session before allowing reset.
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setErr("This reset link is invalid or has expired. Please request a new one.");
      }
      setReady(true);
    }, 250);
    return () => clearTimeout(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) { setErr("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setErr("Passwords do not match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setErr(error.message); setBusy(false); return; }
    setDone(true);
    setBusy(false);
    setTimeout(() => navigate({ to: "/login" }), 1500);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-soft">
        <Link to="/login" className="text-xs text-muted-foreground">← Back to sign in</Link>
        <h1 className="font-display text-2xl mt-3">Set a new password</h1>

        {!ready ? (
          <div className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying reset link…
          </div>
        ) : done ? (
          <div className="mt-6 rounded-xl bg-success/10 text-success p-4 text-sm">
            Password updated. Redirecting to sign in…
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">New password (8+ chars)</span>
              <div className="relative mt-1">
                <input type={showPw ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg border bg-card text-sm" />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 px-2.5 grid place-items-center text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Confirm password</span>
              <div className="relative mt-1">
                <input type={showConfirm ? "text" : "password"} required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg border bg-card text-sm" />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 px-2.5 grid place-items-center text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            {err && <div className="text-sm text-danger bg-danger/10 rounded-lg p-3">{err}</div>}
            <button type="submit" disabled={busy}
              className="w-full py-2.5 rounded-full bg-navy text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
