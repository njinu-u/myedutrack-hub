import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listSecurityEvents, type SecurityEvent } from "@/lib/security-events.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/owner")({
  head: () => ({ meta: [{ title: "Website Owner — Security Monitor" }] }),
  component: OwnerPage,
});

const SEVERITIES = ["all", "info", "low", "medium", "high", "critical"] as const;
const TYPES = [
  "all", "role_change", "owner_promotion",
  "payment_unauthorized", "payment_replay", "payment_failed",
  "cross_school_access",
] as const;

function sevColor(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "critical" || s === "high") return "destructive";
  if (s === "medium") return "default";
  return "secondary";
}

function OwnerPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [severity, setSeverity] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");
  const fetchEvents = useServerFn(listSecurityEvents);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.isAuthed || auth.appUser?.role !== "super_admin") {
      navigate({ to: "/login" });
    }
  }, [auth.loading, auth.isAuthed, auth.appUser?.role]);

  const isOwner = auth.appUser?.role === "super_admin";

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ["security-events", severity, eventType],
    enabled: isOwner,
    queryFn: () => fetchEvents({
      data: {
        limit: 200,
        ...(severity !== "all" ? { severity: severity as "info" } : {}),
        ...(eventType !== "all" ? { event_type: eventType } : {}),
      },
    }),
  });

  if (!isOwner) return null;

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cross-school access, payment anomalies, and privilege escalation events.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
      </header>

      <div className="flex flex-wrap gap-3">
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Event type" /></SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3 font-medium">When</th>
              <th className="p-3 font-medium">Severity</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Message</th>
              <th className="p-3 font-medium">Actor</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : !data || data.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No events yet.</td></tr>
            ) : (
              data.map((e: SecurityEvent) => (
                <tr key={e.id} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="p-3"><Badge variant={sevColor(e.severity)}>{e.severity}</Badge></td>
                  <td className="p-3 font-mono text-xs">{e.event_type}</td>
                  <td className="p-3">
                    <div>{e.message}</div>
                    {e.details && Object.keys(e.details as object).length > 0 ? (
                      <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                        {JSON.stringify(e.details, null, 2)}
                      </pre>
                    ) : null}
                  </td>
                  <td className="p-3 text-xs">
                    <div>{e.actor_email ?? "—"}</div>
                    <div className="text-muted-foreground font-mono">{e.actor_user_id?.slice(0, 8) ?? ""}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
