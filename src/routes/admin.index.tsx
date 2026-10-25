import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHead, Stat } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { KPI, AI_INSIGHTS, ATTENDANCE_TREND, PROJECTIONS, STUDENTS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/dashboards.functions";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Activity, ArrowRight, Sparkles, FileText, Plus, Users, AlertTriangle, Mail } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const auth = useAuth();
  if (auth.isAuthed) return <LiveAdmin />;
  return <DemoAdmin />;
}

function LiveAdmin() {
  const fn = useServerFn(getAdminDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["admin-dash"], queryFn: () => fn() });
  useRealtimeInvalidate(["counselor_flags", "grades", "attendance"], [["admin-dash"]]);
  const trialDays = data?.school?.trial_expires_at
    ? Math.max(0, Math.ceil((new Date(data.school.trial_expires_at).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="space-y-6">
      <PageHead
        title={data?.school?.name ? `Welcome, ${data.school.name}` : "Welcome to your school"}
        subtitle={trialDays !== null ? `Free trial · ${trialDays} days remaining` : "Real-time school overview"}
        actions={
          <>
            <Link to="/admin/invitations" className="px-4 py-2.5 rounded-full text-sm bg-secondary inline-flex gap-2 items-center"><Plus className="h-4 w-4" />Invite staff</Link>
            <Link to="/admin/students" className="px-4 py-2.5 rounded-full text-sm bg-navy text-white inline-flex gap-2 items-center"><FileText className="h-4 w-4" />Manage students</Link>
          </>
        }
      />

      {data?.school?.status === "trial" && trialDays !== null && trialDays < 14 && (
        <AIBlock title={`Your trial ends in ${trialDays} days`} tone="warn">
          Upgrade to keep your school active after the trial. All your data stays — billing simply activates the subscription.
        </AIBlock>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <Stat label="Students" value={isLoading ? "…" : data?.studentCount ?? 0} />
        <Stat label="Teachers" value={isLoading ? "…" : data?.teacherCount ?? 0} />
        <Stat label="Open flags" value={isLoading ? "…" : data?.flagsOpen ?? 0} tone={(data?.flagsOpen ?? 0) > 0 ? "warn" : "default"} />
        <Stat label="Plan" value={data?.school?.plan ?? "—"} />
      </div>

      <Card>
        <h2 className="font-display text-xl flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber" />Recent counselor flags</h2>
        {isLoading ? (
          <div className="text-sm text-muted-foreground mt-3">Loading…</div>
        ) : data?.recentFlags.length === 0 ? (
          <EmptyState icon={<Users className="h-6 w-6" />} title="No flags yet" body="Counselor-raised concerns will appear here as your team starts using the platform." />
        ) : (
          <ul className="mt-4 space-y-2">
            {data?.recentFlags.map((f: any) => (
              <li key={f.id} className="p-3 rounded-xl border flex items-start gap-3">
                <span className={`h-2 w-2 rounded-full mt-2 ${f.severity === "high" ? "bg-danger" : f.severity === "medium" ? "bg-amber" : "bg-teal"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{f.reason}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(f.created_at).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-xl flex items-center gap-2"><Mail className="h-4 w-4 text-teal" />Get started</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>• <Link to="/admin/invitations" className="underline">Invite teachers, counselors, parents and students</Link> using join codes.</li>
          <li>• <Link to="/admin/students" className="underline">Add your students</Link> to the roster.</li>
          <li>• <Link to="/admin/settings" className="underline">Configure school profile</Link>, term dates, and grading scale.</li>
        </ul>
      </Card>
    </div>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="text-center py-10 px-6">
      <div className="h-12 w-12 mx-auto rounded-2xl bg-secondary grid place-items-center text-muted-foreground">{icon}</div>
      <div className="font-display text-lg mt-3">{title}</div>
      <div className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{body}</div>
    </div>
  );
}

function DemoAdmin() {
  return (
    <div className="space-y-6">
      <PageHead
        title="Good morning, Head of School."
        subtitle="Tuesday, 14 May · 482 students learning today across 24 classes · Demo data"
        actions={
          <>
            <button className="px-4 py-2.5 rounded-full text-sm bg-secondary hover:bg-secondary/80 inline-flex gap-2 items-center"><Plus className="h-4 w-4" />Add student</button>
            <button className="px-4 py-2.5 rounded-full text-sm bg-navy text-white inline-flex gap-2 items-center"><FileText className="h-4 w-4" />Generate reports</button>
          </>
        }
      />
      <AIBlock title="Your morning brief" tone="info">
        3 students flagged for intervention. Grade 8B attendance dropped 12% this week. 14 parent reports are ready for delivery. End-of-term projections updated — <span className="font-medium">91% of students on track</span>. <Link to="/admin/analytics" className="underline underline-offset-2">View full breakdown →</Link>
      </AIBlock>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 stagger">
        <Stat label="Students" value={KPI.totalStudents} change="+8 this term" tone="good" />
        <Stat label="Active teachers" value={KPI.activeTeachers} change="2 new hires" />
        <Stat label="Avg attendance" value={`${KPI.avgAttendance}%`} change="-2% vs last week" tone="warn" />
        <Stat label="AI alerts" value={KPI.aiAlerts} change="3 critical" tone="bad" />
        <Stat label="Reports pending" value={KPI.reportsPending} change="Due Friday" tone="warn" />
        <Stat label="Outstanding fees" value={`$${(KPI.outstandingFees/1000).toFixed(1)}k`} change="6 families" tone="warn" />
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">School-wide attendance</div>
              <div className="font-display text-2xl mt-1">8 weeks · trending down on Mondays</div>
            </div>
            <Link to="/admin/attendance" className="text-xs text-teal inline-flex gap-1 items-center">Open <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer>
              <AreaChart data={ATTENDANCE_TREND}>
                <defs><linearGradient id="att" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-teal)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--color-teal)" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[80, 100]} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
                <Area type="monotone" dataKey="rate" stroke="var(--color-teal)" strokeWidth={2.5} fill="url(#att)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">End-of-term projection</div>
          <div className="font-display text-2xl mt-1">482 students</div>
          <div className="h-48 mt-2 relative">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={PROJECTIONS} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={3} stroke="none">
                  {PROJECTIONS.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-center"><div className="font-display text-3xl">91%</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">on track</div></div>
            </div>
          </div>
        </Card>
      </div>
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-teal" /><h2 className="font-display text-xl">AI insights · today</h2></div>
          <Link to="/admin/analytics" className="text-xs text-teal">All insights →</Link>
        </div>
        <ul className="mt-4 space-y-3">
          {AI_INSIGHTS.slice(0, 4).map((a, i) => {
            const c = a.level === "critical" ? "danger" : a.level === "warn" ? "amber" : a.level === "good" ? "success" : "teal";
            return (
              <li key={i} className="flex gap-3 p-3 rounded-xl hover:bg-secondary/60 transition">
                <span className="h-2 w-2 rounded-full mt-2 shrink-0" style={{ background: `var(--color-${c})` }} />
                <div className="min-w-0"><div className="font-medium text-sm">{a.title}</div><div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.body}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">{a.time}</div></div>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-muted-foreground"><Activity className="h-3.5 w-3.5 inline -mt-0.5" /> Flagged students</div>
        <div className="space-y-2 mt-3">
          {STUDENTS.filter(s => s.status === "Critical" || s.status === "At Risk").map((s) => (
            <Link key={s.id} to="/admin/students/$id" params={{ id: s.id }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary">
              <img src={s.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
              <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{s.name}</div><div className="text-[11px] text-muted-foreground truncate">{s.flags[0]}</div></div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${s.status === "Critical" ? "bg-danger/15 text-danger" : "bg-amber/15 text-amber"}`}>{s.status}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
