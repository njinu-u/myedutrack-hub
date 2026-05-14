import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ROLES, type Role } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — EduTrack International" },
      { name: "description", content: "Choose your role to enter the EduTrack portal." },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  component: Login,
});

function Login() {
  const auth = useAuth();
  const navigate = useNavigate();

  const pick = (r: Role) => {
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
          <p className="text-white/70 mt-5 max-w-md">Choose how you'd like to enter today. Each portal is shaped around what you actually need to see — nothing more.</p>
        </div>
        <div className="relative text-xs text-white/50">Demo mode · no password required</div>
      </div>

      <div className="p-8 lg:p-16 flex flex-col justify-center max-w-2xl mx-auto w-full">
        <h2 className="font-display text-3xl">I'm signing in as a…</h2>
        <p className="text-muted-foreground mt-2 text-sm">Pick a role to enter the live demo. Switch any time.</p>
        <div className="mt-8 grid gap-3 stagger">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => pick(r.id)}
              className="group flex items-center gap-4 p-4 rounded-2xl border bg-card hover:border-teal hover:shadow-soft transition text-left"
            >
              <div className="h-12 w-12 rounded-xl bg-secondary grid place-items-center text-2xl">{r.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg leading-tight">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal group-hover:translate-x-1 transition" />
            </button>
          ))}
        </div>
        <Link to="/" className="text-xs text-muted-foreground mt-8 hover:text-foreground">← Back to homepage</Link>
      </div>
    </div>
  );
}
