import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { KOFI } from "@/lib/mock-data";
import { Calendar, MessageCircle, FileText, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/parent/")({ component: ParentHome });

function ParentHome() {
  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-5 bg-gradient-to-br from-[oklch(0.7_0.13_35)]/10 to-transparent">
        <img src={KOFI.photo} alt="" className="h-20 w-20 rounded-2xl object-cover" />
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Your child</div>
          <h1 className="font-display text-3xl mt-1">{KOFI.name}</h1>
          <div className="text-sm text-muted-foreground">{KOFI.grade} · {KOFI.classGroup} · Today: <span className="text-success font-medium">Present</span></div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Mood this week</div>
          <div className="text-4xl mt-1">🙂</div>
        </div>
      </Card>

      <AIBlock title="This week, in plain language" tone="info">
        Kofi is having a mixed month. His science and English are going well — he's in the top third of his class. Math has been a challenge lately, and his teacher has flagged this. We recommend reviewing the resources we've sent and asking Kofi about how he feels about math class. He's settling in socially and his mood has been mostly positive this week.
      </AIBlock>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <QuickLink to="/parent/messages" icon={<MessageCircle />} label="Message teacher" />
        <QuickLink to="/parent/appointments" icon={<Calendar />} label="Book appointment" />
        <QuickLink to="/parent/grades" icon={<GraduationCap />} label="View grades" />
        <QuickLink to="/parent/grades" icon={<FileText />} label="Latest report" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <h2 className="font-display text-xl">Subjects this week</h2>
          <ul className="mt-4 space-y-2.5">
            {KOFI.subjects.slice(0,4).map((s) => (
              <li key={s.name} className="flex items-center justify-between p-3 rounded-xl border">
                <div><div className="font-medium text-sm">{s.name}</div><div className="text-xs text-muted-foreground">{s.trend === "up" ? "Improving" : s.trend === "down" ? "Needs support" : "Steady"}</div></div>
                <div className="font-display text-2xl">{s.grade}</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Recent observations from teachers</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="p-3 rounded-xl border"><div className="text-xs text-muted-foreground">Ms. Odhiambo · Math · 2 days ago</div><div className="mt-1">"Kofi engaged well today and asked a really good question about fractions. Encouraged him to try the practice set tonight."</div></li>
            <li className="p-3 rounded-xl border"><div className="text-xs text-muted-foreground">Mr. Kamau · English · 4 days ago</div><div className="mt-1">"Wonderful contribution in book discussion. His confidence is growing."</div></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-4 rounded-2xl border bg-card hover:border-[oklch(0.7_0.13_35)] transition">
      <div className="h-10 w-10 rounded-xl bg-[oklch(0.7_0.13_35)]/15 text-[oklch(0.5_0.15_35)] grid place-items-center">{icon}</div>
      <div className="text-sm font-medium">{label}</div>
    </Link>
  );
}
