import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHead } from "@/components/portal-layout";
import { AIBlock } from "@/components/ai-block";
import { Send, Languages, FileText, Check } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  component: Reports,
});

const SAMPLE = `Kofi has had a mixed but encouraging term. His Science and English work continues to strengthen — he's now in the top third of Grade 7 in both subjects, with consistent improvement across the last five assessments. His teacher, Ms. Odhiambo, notes Kofi's growing confidence in class discussion and his willingness to ask questions when something isn't clear.

Mathematics has been the focal challenge of the term. Three consecutive assessments show a downward trend, particularly on algebraic expressions. We have flagged this early and built a support plan: targeted homework practice, peer-paired study, and a short re-teach of Unit 4 in week 9.

Socially and emotionally, Kofi is settling in well. His mood check-ins show steady positivity, and he has built strong friendships within 7B. We recommend a brief at-home conversation about how he's experiencing math class, and continued use of the practice resources we've shared.`;

function Reports() {
  return (
    <div className="space-y-6">
      <PageHead title="Reports" subtitle="AI-drafted · teacher-refined · auto-translated · delivered to parents in their language." />

      <AIBlock title="14 reports ready for delivery" tone="info">
        AI has generated narrative drafts for the entire Grade 7 cohort. Teachers have refined 11. Three pending teacher review. Once approved, reports will be auto-translated to English, French, Mandarin, Swahili, Arabic, Hindi, Spanish — and pushed to parent portals + WhatsApp.
      </AIBlock>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs uppercase tracking-wider text-teal">Draft preview</div>
              <h2 className="font-display text-2xl">Kofi Mensah · Term 2 Report</h2>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-full bg-secondary text-xs inline-flex gap-1.5"><Languages className="h-3.5 w-3.5" />English</button>
              <button className="px-3 py-1.5 rounded-full bg-navy text-white text-xs inline-flex gap-1.5"><Send className="h-3.5 w-3.5" />Send to parent</button>
            </div>
          </div>
          <div className="mt-5 p-6 rounded-2xl bg-secondary/40 font-serif text-foreground/85 leading-relaxed text-[17px] whitespace-pre-line">
            {SAMPLE}
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-xl">Delivery status</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { name: "Amara Okeke", s: "Delivered · read", c: "good" },
              { name: "Liam Chen", s: "Delivered (Mandarin)", c: "good" },
              { name: "Priya Sharma", s: "Pending review", c: "warn" },
              { name: "Zara Al-Mansour", s: "Translating (Arabic)", c: "info" },
              { name: "Diego Alvarez", s: "Awaiting counselor input", c: "warn" },
            ].map((r) => (
              <li key={r.name} className="flex items-center gap-3 p-3 rounded-xl border">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0"><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.s}</div></div>
                {r.c === "good" && <Check className="h-4 w-4 text-success" />}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
