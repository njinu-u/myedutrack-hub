import type { ReactNode } from "react";
import { useState } from "react";
import { PageHead, Card } from "@/components/portal-layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowRight, Construction } from "lucide-react";
import { toast } from "sonner";

export interface ModuleSection {
  title: string;
  body: string;
  chip?: string;
  /** Optional click handler. If omitted, the card opens an info dialog. */
  onClick?: () => void;
  /** Optional toast text shown when clicked (for quick wins). */
  toast?: string;
}

export function ModulePage({ title, subtitle, sections }: { title: string; subtitle?: string; sections: ModuleSection[] }) {
  const [active, setActive] = useState<ModuleSection | null>(null);
  return (
    <div className="space-y-6">
      <PageHead title={title} subtitle={subtitle} />
      <div className="grid md:grid-cols-2 gap-4 stagger">
        {sections.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => {
              if (s.onClick) s.onClick();
              else if (s.toast) toast.success(s.toast);
              else setActive(s);
            }}
            className="text-left group"
          >
            <Card className="hover:border-teal/60 hover:shadow-md transition cursor-pointer h-full">
              {s.chip && <div className="text-[10px] uppercase tracking-wider text-teal mb-2">{s.chip}</div>}
              <h3 className="font-display text-xl flex items-center justify-between gap-2">
                {s.title}
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-teal group-hover:translate-x-1 transition" />
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
            </Card>
          </button>
        ))}
      </div>
      <Card className="text-center py-10">
        <Construction className="h-6 w-6 mx-auto text-amber" />
        <div className="text-xs uppercase tracking-wider text-muted-foreground mt-3">Module preview</div>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">This module is fully spec'd and is being rolled out per school during onboarding. Tap any card above to see details.</p>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed">{active?.body}</DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Available in your live deployment after onboarding.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function Wrap({ children }: { children: ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}
