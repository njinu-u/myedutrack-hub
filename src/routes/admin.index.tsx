import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHead, Stat } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { KPI, AI_INSIGHTS, ATTENDANCE_TREND, PROJECTIONS, STUDENTS } from "@/lib/mock-data";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Activity, AlertTriangle, ArrowRight, Sparkles, Users, GraduationCap, CalendarCheck, FileText, Wallet, MessageSquare, BellRing, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHead
        title="Good morning, Head of School."
        subtitle="Tuesday, 14 May · 482 students learning today across 24 classes"
        actions={
          <>
            <button className="px-4 py-2.5 rounded-full text-sm bg-secondary hover:bg-secondary/80 inline-flex gap-2 items-center"><Plus className="h-4 w-4" />Add student</button>
            <button className="px-4 py-2.5 rounded-full text-sm bg-navy text-white inline-flex gap-2 items-center"><FileText className="h-4 w-4" />Generate reports</button>
          </>
        }
      />

      {/* AI morning brief */}
      <AIBlock title="Your morning brief" tone="info">
        3 students flagged for intervention. Grade 8B attendance dropped 12% this week. 14 parent reports are ready for delivery. End-of-term projections updated — <span className="font-medium">91% of students on track</span>. <Link to="/admin/analytics" className="underline underline-offset-2">View full breakdown →</Link>
      </AIBlock>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 stagger">
        <Stat label="Students" value={KPI.totalStudents} change="+8 this term" tone="good" />
        <Stat label="Active teachers" value={KPI.activeTeachers} change="2 new hires" />
        <Stat label="Avg attendance" value={`${KPI.avgAttendance}%`} change="-2% vs last week" tone="warn" />
        <Stat label="AI alerts" value={KPI.aiAlerts} change="3 critical" tone="bad" />
        <Stat label="Reports pending" value={KPI.reportsPending} change="Due Friday" tone="warn" />
        <Stat label="Outstanding fees" value={`$${(KPI.outstandingFees/1000).toFixed(1)}k`} change="6 families" tone="warn" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Attendance trend */}
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
                <defs>
                  <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-teal)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-teal)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[80, 100]} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
                <Area type="monotone" dataKey="rate" stroke="var(--color-teal)" strokeWidth={2.5} fill="url(#att)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* End-of-term projections */}
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
              <div className="text-center">
                <div className="font-display text-3xl">91%</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">on track</div>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 mt-3 text-xs">
            {PROJECTIONS.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                <span className="flex-1 text-muted-foreground">{p.name}</span>
                <span className="font-medium">{p.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* AI insights feed */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal" />
              <h2 className="font-display text-xl">AI insights · today</h2>
            </div>
            <Link to="/admin/analytics" className="text-xs text-teal">All insights →</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {AI_INSIGHTS.slice(0, 4).map((a, i) => {
              const c = a.level === "critical" ? "danger" : a.level === "warn" ? "amber" : a.level === "good" ? "success" : "teal";
              return (
                <li key={i} className="flex gap-3 p-3 rounded-xl hover:bg-secondary/60 transition">
                  <span className={`h-2 w-2 rounded-full mt-2 shrink-0`} style={{ background: `var(--color-${c})` }} />
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{a.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.body}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">{a.time}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Mood pulse + flagged */}
        <div className="space-y-5">
          <Card>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">School mood pulse</div>
            <div className="flex items-center justify-between mt-3">
              <div className="font-display text-5xl">😊</div>
              <div className="text-right">
                <div className="font-display text-3xl">3.9<span className="text-base text-muted-foreground">/5</span></div>
                <div className="text-xs text-success">+0.2 vs last week</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-5 text-center text-xl">
              <span className="opacity-30">😔</span><span className="opacity-40">😐</span><span className="opacity-60">🙂</span><span className="ring-2 ring-amber rounded-full">😊</span><span className="opacity-50">😄</span>
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Flagged students</div>
            <div className="space-y-2 mt-3">
              {STUDENTS.filter(s => s.status === "Critical" || s.status === "At Risk").map((s) => (
                <Link key={s.id} to={`/admin/students/${s.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary">
                  <img src={s.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{s.flags[0]}</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${s.status === "Critical" ? "bg-danger/15 text-danger" : "bg-amber/15 text-amber"}`}>{s.status}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Live class strip */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground"><Activity className="h-3.5 w-3.5 inline -mt-0.5" /> Live · 11:24 AM</div>
            <h2 className="font-display text-xl mt-1">Classes happening now</h2>
          </div>
          <Link to="/admin/timetable" className="text-xs text-teal">Full timetable →</Link>
        </div>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { c: "Math · 7B", t: "Ms. Odhiambo", r: "Room 12", k: 22 },
            { c: "English · 8A", t: "Mr. Kamau", r: "Room 7", k: 24 },
            { c: "Science · 9A", t: "Dr. Patel", r: "Lab 2", k: 19 },
            { c: "Art · 6C", t: "Ms. Yusuf", r: "Studio", k: 18 },
          ].map((c) => (
            <div key={c.c} className="rounded-xl border p-3 hover:border-teal transition">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.r}</span>
                <span className="flex items-center gap-1 text-success"><span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />Live</span>
              </div>
              <div className="font-display text-lg mt-1">{c.c}</div>
              <div className="text-xs text-muted-foreground">{c.t} · {c.k} students</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
