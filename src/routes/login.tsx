import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ROLES, type Role } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — EduTrack International" },
      { name: "description", content: "Sign in to your school portal or try the live demo." },
    ],
  }),
  component: Login,
});

function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) { setErr(error?.message ?? "Sign in failed"); setBusy(false); return; }
    const { data: profile } = await supabase
      .from("app_users")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    const role = profile?.role;
    if (!role) {
      await supabase.auth.signOut();
      setErr("Your account isn't linked to a school yet. Please contact your school admin.");
      setBusy(false);
      return;
    }
    const target = role === "school_admin" ? "/admin"
      : role === "teacher" ? "/teacher"
      : role === "counselor" ? "/counselor"
      : role === "parent" ? "/parent"
      : role === "student" ? "/student"
      : null;
    if (!target) {
      await supabase.auth.signOut();
      setErr("Your account role isn't recognised. Please contact your school admin.");
      setBusy(false);
      return;
    }
    navigate({ to: target as "/admin" });
  };

  const pickDemo = (r: Role) => {
    auth.setRole(r);
    navigate({ to: `/${r}` as "/admin" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative gradient-hero text-white p-10 lg:p-16 flex flex-col justify-between grain overflow-hidden">
        <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-amber/20 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-amber grid place-items-center text-navy font-display font-bold">E</div>
          <span className="font-display text-xl">EduTrack International</span>
        </Link>
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.25em] text-amber">Welcome back</div>
          <h1 className="font-display text-4xl md:text-6xl mt-4 text-balance">Every student seen. <em className="not-italic text-amber">Every family connected.</em></h1>
          <p className="text-white/70 mt-5 max-w-md">Sign in to your school account, or jump straight into the live demo to see how it works.</p>
        </div>
        <div className="relative text-xs text-white/50">No school account yet? <Link to="/signup" className="text-amber underline">Start a 90-day free pilot</Link></div>
      </div>

      <div className="p-8 lg:p-16 flex flex-col justify-center max-w-2xl mx-auto w-full">
        <h2 className="font-display text-3xl">Sign in to your school</h2>
        <form onSubmit={handleLogin} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1 w-full px-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="mt-1 w-full px-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </label>
          {err && <div className="text-sm text-danger bg-danger/10 rounded-lg p-3">{err}</div>}
          <button type="submit" disabled={busy} className="w-full py-3 rounded-full bg-navy text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-3">
          New school? <Link to="/signup" className="text-navy underline">Create an account</Link>
        </p>

        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Or try a demo portal</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-2 stagger">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => pickDemo(r.id)}
                className="group flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-teal hover:shadow-soft transition text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center text-xl">{r.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm leading-tight">{r.label} demo</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal group-hover:translate-x-1 transition" />
              </button>
            ))}
          </div>
        </div>

        <Link to="/" className="text-xs text-muted-foreground mt-8 hover:text-foreground">← Back to homepage</Link>
      </div>
    </div>
  );
}
