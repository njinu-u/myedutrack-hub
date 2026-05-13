import { createFileRoute, Link } from "@tanstack/react-router";
import { ROLES } from "@/lib/mock-data";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Live demo — EduTrack International" },
      { name: "description", content: "Step inside Kofi Mensah's profile and explore every EduTrack portal in read-only demo mode." },
    ],
    links: [{ rel: "canonical", href: "/demo" }],
  }),
  component: Demo,
});

function Demo() {
  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-hero text-white grain relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,white/10,transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-5 lg:px-8 py-20 lg:py-28">
          <Link to="/" className="text-xs text-white/60 hover:text-white">← Home</Link>
          <div className="text-xs uppercase tracking-[0.25em] text-amber mt-6">Live demo</div>
          <h1 className="font-display text-5xl md:text-7xl mt-4 text-balance max-w-3xl">Meet Kofi Mensah. <em className="not-italic text-amber">Grade 7 · Joined Sep 2024.</em></h1>
          <p className="mt-5 text-white/75 max-w-2xl text-lg">A real-feeling student profile, fully populated. Step into any portal to see exactly what that role would see — admins, teachers, counselors, parents and Kofi himself.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 lg:px-8 py-16">
        <h2 className="font-display text-3xl">Choose a viewpoint</h2>
        <p className="text-muted-foreground mt-2">Each portal is colour-coded and shaped around its user.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 stagger">
          {ROLES.map((r) => (
            <Link key={r.id} to={`/${r.id}` as "/admin"} className="rounded-2xl p-6 border bg-card hover:shadow-elevated hover:-translate-y-1 transition">
              <div className="text-3xl">{r.emoji}</div>
              <div className="font-display text-2xl mt-3">{r.label}</div>
              <div className="text-sm text-muted-foreground mt-1">{r.desc}</div>
              <div className="mt-5 inline-flex items-center gap-1.5 text-sm text-teal">Enter portal <ArrowRight className="h-4 w-4" /></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
