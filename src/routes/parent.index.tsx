import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { KOFI } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { getParentDashboard } from "@/lib/dashboards.functions";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Calendar, MessageCircle, FileText, GraduationCap, UserPlus } from "lucide-react";

export const Route = createFileRoute("/parent/")({ component: ParentHome });

function ParentHome() {
  const auth = useAuth();
  return auth.isAuthed ? <LiveParent /> : <DemoParent />;
}

function LiveParent() {
  const fn = useServerFn(getParentDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["parent-dash"], queryFn: () => fn() });
  useRealtimeInvalidate(["grades", "attendance"], [["parent-dash"]]);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  if (!data?.student) {
    return (
      <div className="space-y-6">
        <PageHead title="Welcome" subtitle="Your child's school will link your account to your child shortly." />
        <Card>
          <div className="text-center py-10">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-secondary grid place-items-center"><UserPlus className="h-6 w-6 text-muted-foreground" /></div>
            <div className="font-display text-lg mt-3">No child linked yet</div>
            <div className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Ask your school administrator to link your account to your child's profile.</div>
          </div>
        </Card>
      </div>
    );
  }

  const subjectAvgs = Object.entries(
    (data.grades as any[]).reduce<Record<string, { total: number; n: number }>>((acc, g) => {
      const k = g.subject;
      acc[k] ??= { total: 0, n: 0 };
      acc[k].total += (g.score / g.max_score) * 100;
      acc[k].n += 1;
      return acc;
    }, {})
  ).map(([subject, v]) => ({ subject, avg: Math.round(v.total / v.n) }));

  const attRate = data.attendance.length
    ? Math.round((data.attendance.filter((a: any) => a.status === "present").length / data.attendance.length) * 100)
    : null;

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-5">
        {data.student.photo_url && <img src={data.student.photo_url} alt="" className="h-20 w-20 rounded-2xl object-cover" />}
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Your child</div>
          <h1 className="font-display text-3xl mt-1">{data.student.full_name}</h1>
          <div className="text-sm text-muted-foreground">{data.student.grade ?? ""} {data.student.class_id ? "· " + data.student.class_id : ""}</div>
        </div>
        {attRate !== null && (
          <div className="text-center"><div className="text-xs uppercase tracking-wider text-muted-foreground">Attendance (2 wk)</div><div className="font-display text-3xl mt-1">{attRate}%</div></div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <QuickLink to="/parent/messages" icon={<MessageCircle />} label={`Messages${data.unreadMessages ? ` (${data.unreadMessages})` : ""}`} />
        <QuickLink to="/parent/appointments" icon={<Calendar />} label="Book appointment" />
        <QuickLink to="/parent/grades" icon={<GraduationCap />} label="View grades" />
        <QuickLink to="/parent/attendance" icon={<FileText />} label="Attendance" />
      </div>

      <Card>
        <h2 className="font-display text-xl">Recent grades</h2>
        {subjectAvgs.length === 0 ? (
          <div className="text-sm text-muted-foreground mt-3">No grades posted yet.</div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {subjectAvgs.map((s) => (
              <li key={s.subject} className="flex items-center justify-between p-3 rounded-xl border">
                <div className="font-medium text-sm">{s.subject}</div>
                <div className="font-display text-2xl">{s.avg}%</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function DemoParent() {
  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-5 bg-gradient-to-br from-[oklch(0.7_0.13_35)]/10 to-transparent">
        <img src={KOFI.photo} alt="" className="h-20 w-20 rounded-2xl object-cover" />
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Your child (demo)</div>
          <h1 className="font-display text-3xl mt-1">{KOFI.name}</h1>
          <div className="text-sm text-muted-foreground">{KOFI.grade} · {KOFI.classGroup} · Today: <span className="text-success font-medium">Present</span></div>
        </div>
        <div className="text-center"><div className="text-xs uppercase tracking-wider text-muted-foreground">Mood this week</div><div className="text-4xl mt-1">🙂</div></div>
      </Card>
      <AIBlock title="This week, in plain language" tone="info">
        Kofi is having a mixed month. His science and English are going well. Math has been a challenge lately, and his teacher has flagged this.
      </AIBlock>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <QuickLink to="/parent/messages" icon={<MessageCircle />} label="Message teacher" />
        <QuickLink to="/parent/appointments" icon={<Calendar />} label="Book appointment" />
        <QuickLink to="/parent/grades" icon={<GraduationCap />} label="View grades" />
        <QuickLink to="/parent/grades" icon={<FileText />} label="Latest report" />
      </div>
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
