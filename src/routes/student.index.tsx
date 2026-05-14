import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { KOFI } from "@/lib/mock-data";
import { Flame, Sparkles } from "lucide-react";

export const Route = createFileRoute("/student/")({ component: StudentDash });

function StudentDash() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-[oklch(0.5_0.14_160)]">Good morning</div>
        <h1 className="font-display text-4xl md:text-5xl mt-1">Hi Kofi! Here's where you stand today. ✨</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-4 stagger">
        <Card className="bg-gradient-to-br from-[oklch(0.7_0.16_145)]/15 to-transparent">
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-amber" /> Streak</div>
          <div className="font-display text-4xl mt-1">7 days 🔥</div>
          <div className="text-xs text-muted-foreground mt-1">Mood check-in streak</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Next assessment</div>
          <div className="font-display text-2xl mt-1">Math test</div>
          <div className="text-xs text-muted-foreground mt-1">In 4 days</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-teal" /> Personal best</div>
          <div className="font-display text-2xl mt-1">Science · 84%</div>
          <div className="text-xs text-muted-foreground mt-1">Can you beat it?</div>
        </Card>
      </div>
      <Card className="bg-gradient-to-br from-[oklch(0.65_0.16_145)] to-[oklch(0.5_0.14_160)] text-white">
        <div className="text-xs uppercase tracking-wider opacity-70">Your AI coach says</div>
        <p className="font-display text-2xl mt-2 text-balance">Your science scores have improved 3 weeks in a row. You're getting better at the tricky parts. Keep going!</p>
      </Card>
      <Card>
        <h2 className="font-display text-xl">Your subjects</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {KOFI.subjects.map((s) => (
            <Link key={s.name} to="/student/grades" className="p-4 rounded-xl border hover:border-[oklch(0.65_0.16_145)] transition">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.name}</div>
              <div className="flex items-end justify-between mt-1"><div className="font-display text-3xl">{s.grade}</div><div className={`text-xs ${s.trend === "up" ? "text-success" : s.trend === "down" ? "text-danger" : "text-muted-foreground"}`}>{s.trend === "up" ? "↑" : s.trend === "down" ? "↓" : "→"}</div></div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
