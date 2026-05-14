import type { ReactNode } from "react";
import { PageHead, Card } from "@/components/portal-layout";
import { Construction } from "lucide-react";

export function ModulePage({ title, subtitle, sections }: { title: string; subtitle?: string; sections: { title: string; body: string; chip?: string }[] }) {
  return (
    <div className="space-y-6">
      <PageHead title={title} subtitle={subtitle} />
      <div className="grid md:grid-cols-2 gap-4 stagger">
        {sections.map((s) => (
          <Card key={s.title}>
            {s.chip && <div className="text-[10px] uppercase tracking-wider text-teal mb-2">{s.chip}</div>}
            <h3 className="font-display text-xl">{s.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
          </Card>
        ))}
      </div>
      <Card className="text-center py-10">
        <Construction className="h-6 w-6 mx-auto text-amber" />
        <div className="text-xs uppercase tracking-wider text-muted-foreground mt-3">Module preview</div>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">This module is fully spec'd and is being rolled out per school during onboarding. Every feature above is wired into the EduTrack data model.</p>
      </Card>
    </div>
  );
}

export function Wrap({ children }: { children: ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}
