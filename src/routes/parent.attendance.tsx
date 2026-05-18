import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/parent/attendance")({ component: ParentAttendance });

const STATUSES = ["p","p","p","p","l","-","-","p","p","a","p","p","-","-","p","p","p","p","p","-","-","p","p","p","p","p","-","-","p","p"];
const map = { p: { c: "bg-success/30 text-success", l: "P" }, a: { c: "bg-danger/30 text-danger", l: "A" }, l: { c: "bg-amber/30 text-amber", l: "L" }, "-": { c: "bg-secondary text-muted-foreground", l: "" } } as const;

function ParentAttendance() {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (reason.trim().length < 3) { toast.error("Please add a short reason."); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false); setReason("");
    toast.success("Absence reason sent to the school");
  };
  return (
    <div className="space-y-6">
      <PageHead title="Kofi's attendance" subtitle="92% this term · 4 absences this month" />
      <Card>
        <h2 className="font-display text-xl">May 2026</h2>
        <div className="grid grid-cols-7 gap-2 mt-4 text-center text-xs text-muted-foreground">
          {["M","T","W","T","F","S","S"].map((d,i)=> <div key={i}>{d}</div>)}
          {STATUSES.map((s, i) => {
            const m = map[s as keyof typeof map];
            return <div key={i} className={cn("aspect-square rounded-md grid place-items-center font-medium text-sm", m.c)}>{i+1}<span className="text-[9px]">{m.l}</span></div>;
          })}
        </div>
        <div className="mt-4 flex gap-3 text-xs"><span><span className="inline-block h-2.5 w-2.5 bg-success/50 rounded-sm mr-1"/>Present</span><span><span className="inline-block h-2.5 w-2.5 bg-amber/50 rounded-sm mr-1"/>Late</span><span><span className="inline-block h-2.5 w-2.5 bg-danger/50 rounded-sm mr-1"/>Absent</span></div>
      </Card>
      <Card>
        <h3 className="font-display text-lg">Log an absence reason</h3>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us why Kofi was absent…" className="w-full mt-3 p-3 rounded-xl border bg-background text-sm" rows={3}/>
        <button onClick={submit} disabled={saving} className="mt-3 px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex items-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Submit
        </button>
      </Card>
    </div>
  );
}
