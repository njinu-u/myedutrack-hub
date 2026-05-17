import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/portal-layout";
import { KOFI } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { getStudentDashboard } from "@/lib/dashboards.functions";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Flame, Sparkles, BookOpen } from "lucide-react";

export const Route = createFileRoute("/student/")({ component: StudentDash });

function StudentDash() {
  const auth = useAuth();
  return auth.isAuthed ? <LiveStudent /> : <DemoStudent />;
}

function LiveStudent() {
  const fn = useServerFn(getStudentDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["student-dash"], queryFn: () => fn() });
  useRealtimeInvalidate(["grades", "mood_checkins"], [["student-dash"]]);
  const firstName = (data?.fullName ?? "there").split(" ")[0];
  const moodEmoji = data?.recentMood ? ["😢","😟","😐","🙂","😊"][Math.max(0, Math.min(4, data.recentMood.mood - 1))] : "✨";

  const subjects = Object.entries(
    ((data?.grades ?? []) as any[]).reduce<Record<string, { total: number; n: number }>>((acc, g) => {
      acc[g.subject] ??= { total: 0, n: 0 };
      acc[g.subject].total += (g.score / g.max_score) * 100;
      acc[g.subject].n += 1;
      return acc;
    }, {})
  ).map(([subject, v]) => ({ subject, avg: Math.round(v.total / v.n) }));

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-[oklch(0.5_0.14_160)]">Welcome back</div>
        <h1 className="font-display text-4xl md:text-5xl mt-1">Hi {firstName}! {moodEmoji}</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-4 stagger">
        <Card className="bg-gradient-to-br from-[oklch(0.7_0.16_145)]/15 to-transparent">
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-amber" /> Mood check-ins</div>
          <div className="font-display text-4xl mt-1">{data?.moodStreak ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Recent check-ins</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Subjects</div>
          <div className="font-display text-4xl mt-1">{subjects.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Tracking grades</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-teal" /> Best subject</div>
          <div className="font-display text-2xl mt-1">{subjects.sort((a,b) => b.avg - a.avg)[0]?.subject ?? "—"}</div>
          <div className="text-xs text-muted-foreground mt-1">{subjects[0]?.avg ? subjects[0].avg + "%" : "Add grades to see"}</div>
        </Card>
      </div>
      <Card>
        <h2 className="font-display text-xl flex items-center gap-2"><BookOpen className="h-4 w-4 text-teal" />Your subjects</h2>
        {isLoading ? <div className="text-sm text-muted-foreground mt-3">Loading…</div> :
          subjects.length === 0 ? (
            <div className="text-center py-10">
              <div className="font-display text-lg">No grades yet</div>
              <div className="text-sm text-muted-foreground mt-1">Your teachers will start posting grades soon.</div>
              <Link to="/student/mood" className="inline-block mt-4 px-4 py-2 rounded-full bg-navy text-white text-sm">Log today's mood</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {subjects.map((s) => (
                <Link key={s.subject} to="/student/grades" className="p-4 rounded-xl border hover:border-[oklch(0.65_0.16_145)] transition">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.subject}</div>
                  <div className="font-display text-3xl mt-1">{s.avg}%</div>
                </Link>
              ))}
            </div>
          )
        }
      </Card>
    </div>
  );
}

function DemoStudent() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-[oklch(0.5_0.14_160)]">Good morning (demo)</div>
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
        <p className="font-display text-2xl mt-2 text-balance">Your science scores have improved 3 weeks in a row. Keep going!</p>
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
