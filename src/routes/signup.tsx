import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { signupSchoolAdmin } from "@/lib/signup.functions";
import { ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Start your 90-day free pilot — EduTrack International" },
      { name: "description", content: "Create your school admin account and start a 90-day free pilot of EduTrack." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const signup = useServerFn(signupSchoolAdmin);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    school_name: "", full_name: "", email: "", password: "",
    country: "", student_count: 100,
  });

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await signup({ data: { ...form, student_count: Number(form.student_count) } });
      if (!res.ok) { setErr(res.error); setBusy(false); return; }
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) { setErr(error.message); setBusy(false); return; }
      navigate({ to: "/admin" });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Signup failed");
      setBusy(false);
    }
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
          <div className="text-xs uppercase tracking-[0.25em] text-amber">90-day free pilot</div>
          <h1 className="font-display text-4xl md:text-6xl mt-4 text-balance">Open your school's account in <em className="not-italic text-amber">under two minutes</em>.</h1>
          <p className="text-white/70 mt-5 max-w-md">Only the school admin signs up. Teachers, counselors, parents, and students join via invite codes you generate from inside the portal.</p>
        </div>
        <div className="relative text-xs text-white/50">No credit card. No installation. Cancel any time.</div>
      </div>

      <div className="p-8 lg:p-16 flex flex-col justify-center max-w-2xl mx-auto w-full">
        <h2 className="font-display text-3xl">Create your school admin account</h2>
        <p className="text-muted-foreground mt-2 text-sm">You'll get 90 days free. After that, $12/student/year keeps everyone connected.</p>

        <form onSubmit={handle} className="mt-8 space-y-4">
          <Field label="School name" value={form.school_name} onChange={(v) => setForm({ ...form, school_name: v })} placeholder="Riverside International School" required />
          <Field label="Your full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} placeholder="Adwoa Mensah" required />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="admin@school.edu" required />
          <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="At least 8 characters" required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} placeholder="Kenya" required />
            <Field label="Number of students" type="number" value={String(form.student_count)} onChange={(v) => setForm({ ...form, student_count: Number(v) })} required />
          </div>

          {err && <div className="text-sm text-danger bg-danger/10 rounded-lg p-3">{err}</div>}

          <button type="submit" disabled={busy} className="w-full py-3 rounded-full bg-navy text-white font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {busy ? "Creating your school…" : "Start 90-day free pilot"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-6">
          Already have an account? <Link to="/login" className="text-navy underline">Sign in</Link> · <Link to="/" className="hover:text-foreground">Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full px-4 py-2.5 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
      />
    </label>
  );
}
