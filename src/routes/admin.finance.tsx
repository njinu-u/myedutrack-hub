import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead, Stat } from "@/components/portal-layout";
import { Download, Send, Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { downloadPdf } from "@/lib/export";

export const Route = createFileRoute("/admin/finance")({
  component: Finance,
});

function Finance() {
  const studentCount = 482;
  const annual = studentCount * 12;
  return (
    <div className="space-y-6">
      <PageHead title="Finance" subtitle="Invoice generation, fee tracking, automated reminders — built around the $12/student/year model." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <Stat label="Billed (term)" value={`$${annual.toLocaleString()}`} change="482 students × $12" />
        <Stat label="Collected" value="$5,260" change="91% paid" tone="good" />
        <Stat label="Outstanding" value="$24,800" change="6 families overdue" tone="warn" />
        <Stat label="Renewal rate" value="96%" change="vs 89% last yr" tone="good" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-xl">Invoice generator</h2>
          <p className="text-xs text-muted-foreground mt-1">Auto-calculates at $12 / student / year</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-5 text-sm">
            <Field label="School name" value="Riverside International School" />
            <Field label="Contact" value="bursar@riverside.ke" />
            <Field label="Address" value="Karen Road, Nairobi 00502" />
            <Field label="Student count" value="482" />
          </div>

          <div className="mt-6 rounded-2xl bg-secondary/50 p-5 border-2 border-dashed">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Invoice preview · #INV-2026-014</div>
                <h3 className="font-display text-2xl mt-1">EduTrack International — Annual Subscription</h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Total due</div>
                <div className="font-display text-3xl">${annual.toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-4 text-sm border-t pt-3 grid grid-cols-3 gap-2 text-muted-foreground">
              <div><div className="text-[10px] uppercase">Per student</div><div className="text-foreground">$12.00</div></div>
              <div><div className="text-[10px] uppercase">Students</div><div className="text-foreground">482</div></div>
              <div><div className="text-[10px] uppercase">Period</div><div className="text-foreground">Sep 2026 – Aug 2027</div></div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground border-t pt-3 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" /> Standard Chartered Bank Kenya · SWIFT: SCBLKENX
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="px-4 py-2 rounded-full bg-secondary text-sm inline-flex gap-2"><Download className="h-4 w-4" />Download PDF</button>
            <button className="px-4 py-2 rounded-full bg-navy text-white text-sm inline-flex gap-2"><Send className="h-4 w-4" />Email invoice</button>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-xl">Overdue families</h2>
          <ul className="mt-4 space-y-3">
            {[
              { name: "Alvarez family", amt: 12, days: 22 },
              { name: "Chen family", amt: 12, days: 14 },
              { name: "Mensah family", amt: 12, days: 9 },
              { name: "Hassan family", amt: 12, days: 6 },
            ].map((f) => (
              <li key={f.name} className="flex items-center justify-between p-3 rounded-xl border">
                <div>
                  <div className="text-sm font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground">${f.amt} · {f.days} days overdue</div>
                </div>
                <button className="text-xs px-3 py-1.5 rounded-full bg-amber/15 text-amber font-medium">Remind</button>
              </li>
            ))}
          </ul>
          <button className="mt-4 w-full py-2.5 rounded-full bg-secondary text-sm">Send all reminders via WhatsApp</button>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}
