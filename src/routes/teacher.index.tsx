import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHead, Stat } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { TODAY_TIMETABLE, PARENT_MESSAGES, STUDENTS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { getTeacherDashboard } from "@/lib/dashboards.functions";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { CalendarCheck, BookMarked, MessageSquare, Notebook } from "lucide-react";

export const Route = createFileRoute("/teacher/")({ component: Dash });

function Dash() {
  const auth = useAuth();
  return auth.isAuthed ? <LiveTeacher /> : <DemoTeacher />;
}

function LiveTeacher() {
  const fn = useServerFn(getTeacherDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["teacher-dash"], queryFn: () => fn() });
  const auth = useAuth();
  return (
    <div className="space-y-6">
      <PageHead title={`Welcome${auth.appUser?.full_name ? ", " + auth.appUser.full_name : ""}`} subtitle="Your teaching dashboard" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 stagger">
        <Stat label="Observations logged" value={isLoading ? "…" : data?.observationsCount ?? 0} />
        <Stat label="Unread messages" value={isLoading ? "…" : data?.unreadMessages ?? 0} tone={(data?.unreadMessages ?? 0) > 0 ? "warn" : "default"} />
        <Stat label="This week" value={(data?.recentObs ?? []).filter((o: any) => new Date(o.created_at).getTime() > Date.now() - 7 * 86400000).length} />
      </div>
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl flex items-center gap-2"><Notebook className="h-4 w-4 text-teal" />Recent observations</h2>
          <Link to="/teacher/observations" className="text-xs text-teal">Add observation →</Link>
        </div>
        {isLoading ? <div className="text-sm text-muted-foreground mt-3">Loading…</div> :
          (data?.recentObs ?? []).length === 0 ? (
            <div className="text-center py-10">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-secondary grid place-items-center"><Notebook className="h-6 w-6 text-muted-foreground" /></div>
              <div className="font-display text-lg mt-3">No observations yet</div>
              <div className="text-sm text-muted-foreground mt-1">Log your first student observation to get AI-generated next-step suggestions.</div>
              <Link to="/teacher/observations" className="inline-block mt-4 px-4 py-2 rounded-full bg-navy text-white text-sm">Start observing</Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {data!.recentObs.map((o: any) => (
                <li key={o.id} className="p-3 rounded-xl border">
                  <div className="text-xs text-muted-foreground">{o.subject || "Observation"} · {new Date(o.created_at).toLocaleDateString()}</div>
                  <div className="text-sm mt-1 line-clamp-2">{o.note}</div>
                  {o.tags?.length > 0 && <div className="flex gap-1 mt-2">{o.tags.map((t: string) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary">{t}</span>)}</div>}
                </li>
              ))}
            </ul>
          )
        }
      </Card>
    </div>
  );
}

function DemoTeacher() {
  return (
    <div className="space-y-6">
      <PageHead title="Good morning, Ms. Odhiambo." subtitle="3 classes today · 2 grade entries due Friday · 2 unread parent messages · Demo data" />
      <AIBlock title="Your day at a glance" tone="info">Class 7B Math at 8:00 — 2 students flagged: Kofi (declining 3 wks), Diego (urgent). Suggested 5-min check-in with each before lesson.</AIBlock>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <Stat label="Classes today" value="3" />
        <Stat label="Pending grades" value="14" change="Due Friday" tone="warn" />
        <Stat label="Flagged students" value="3" tone="bad" />
        <Stat label="Unread messages" value="2" />
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <h2 className="font-display text-xl flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-teal" />Today's timetable</h2>
          <ul className="mt-4 space-y-2">
            {TODAY_TIMETABLE.map((t) => (
              <li key={t.time} className="flex items-center gap-3 p-3 rounded-xl border">
                <div className="font-display text-lg w-14">{t.time}</div>
                <div className="flex-1"><div className="font-medium text-sm">{t.subject}</div><div className="text-xs text-muted-foreground">{t.room}</div></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-xl flex items-center gap-2"><BookMarked className="h-4 w-4 text-teal" />Students needing attention</h2>
          <ul className="mt-4 space-y-2">
            {STUDENTS.filter(s => s.flags.length > 0).slice(0,4).map((s) => (
              <li key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary">
                <img src={s.photo} className="h-9 w-9 rounded-full object-cover" alt="" />
                <div className="flex-1 min-w-0"><div className="text-sm font-medium">{s.name}</div><div className="text-[11px] text-muted-foreground truncate">{s.flags[0]}</div></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-xl flex items-center gap-2"><MessageSquare className="h-4 w-4 text-teal" />Parent messages</h2>
          <ul className="mt-4 space-y-2">
            {PARENT_MESSAGES.map((m) => (
              <li key={m.from} className="p-3 rounded-xl border">
                <div className="flex items-center justify-between"><div className="text-sm font-medium">{m.from}</div>{m.unread && <span className="h-2 w-2 rounded-full bg-amber" />}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{m.subject}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{m.time} · {m.lang}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
