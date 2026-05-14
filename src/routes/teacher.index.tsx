import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, PageHead, Stat } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { TODAY_TIMETABLE, PARENT_MESSAGES, STUDENTS } from "@/lib/mock-data";
import { CalendarCheck, GraduationCap, BookMarked, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/teacher/")({ component: Dash });

function Dash() {
  return (
    <div className="space-y-6">
      <PageHead title="Good morning, Ms. Odhiambo." subtitle="3 classes today · 2 grade entries due Friday · 2 unread parent messages" />
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
          <Link to="/teacher/messages" className="mt-3 block text-center text-xs text-teal">All messages →</Link>
        </Card>
      </div>
    </div>
  );
}
