import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHead, Stat } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { STUDENTS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { getCounselorDashboard } from "@/lib/dashboards.functions";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/counselor/")({ component: Dash });

function Dash() {
  const auth = useAuth();
  return auth.isAuthed ? <LiveCounselor /> : <DemoCounselor />;
}

function LiveCounselor() {
  const fn = useServerFn(getCounselorDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["counselor-dash"], queryFn: () => fn() });
  useRealtimeInvalidate(["counselor_flags", "mood_checkins"], [["counselor-dash"]]);
  return (
    <div className="space-y-6">
      <PageHead title="Wellbeing dashboard" subtitle="Live view across your school" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 stagger">
        <Stat label="Open flags" value={isLoading ? "…" : data?.openFlags ?? 0} tone={(data?.openFlags ?? 0) > 0 ? "warn" : "default"} />
        <Stat label="Resolved" value={(data?.flags ?? []).filter((f: any) => f.resolved_at).length} tone="good" />
        <Stat label="This week" value={(data?.flags ?? []).filter((f: any) => new Date(f.created_at).getTime() > Date.now() - 7 * 86400000).length} />
      </div>
      <Card>
        <h2 className="font-display text-xl">Recent flags</h2>
        {isLoading ? <div className="text-sm text-muted-foreground mt-3">Loading…</div> :
          (data?.flags ?? []).length === 0 ? (
            <div className="text-center py-10">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-secondary grid place-items-center"><Heart className="h-6 w-6 text-muted-foreground" /></div>
              <div className="font-display text-lg mt-3">No flags raised yet</div>
              <div className="text-sm text-muted-foreground mt-1">Wellbeing concerns logged by staff will appear here.</div>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {data!.flags.map((f: any) => (
                <li key={f.id} className="p-3 rounded-xl border flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${f.severity === "high" ? "bg-danger" : f.severity === "medium" ? "bg-amber" : "bg-teal"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{f.reason}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(f.created_at).toLocaleString()}{f.resolved_at ? " · resolved" : ""}</div>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </Card>
    </div>
  );
}

function DemoCounselor() {
  const flagged = STUDENTS.filter(s => s.status === "Critical" || s.status === "At Risk" || s.flags.length > 0);
  return (
    <div className="space-y-6">
      <PageHead title="Wellbeing dashboard" subtitle="6 students under active support · 3 flagged this week · Demo data" />
      <AIBlock title="Diego Alvarez · escalation recommended" tone="critical">Attendance 65%, mood 1/5 sustained 2 weeks, 4 subjects in decline. Causal chain suggests family transition stress + academic pressure spiral.</AIBlock>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <Stat label="Active interventions" value="11" />
        <Stat label="New flags · week" value="3" tone="warn" />
        <Stat label="Improvement rate" value="68%" change="post-intervention" tone="good" />
        <Stat label="Sessions this week" value="14" />
      </div>
      <Card>
        <h2 className="font-display text-xl">Students needing support</h2>
        <ul className="mt-4 space-y-2">
          {flagged.map((s) => (
            <li key={s.id} className="flex items-center gap-3 p-3 rounded-xl border">
              <img src={s.photo} className="h-10 w-10 rounded-full object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{s.name} <span className="text-xs text-muted-foreground">· {s.grade}</span></div>
                <div className="text-xs text-muted-foreground">{s.flags.join(" · ") || "Monitoring"}</div>
              </div>
              <div className="text-2xl">{["😢","😟","😐","🙂","😊"][s.mood-1]}</div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${s.status === "Critical" ? "bg-danger/15 text-danger" : "bg-amber/15 text-amber"}`}>{s.status}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
