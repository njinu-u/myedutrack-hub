import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AIBlock({ title, children, tone = "info", icon }: { title: string; children: ReactNode; tone?: "info" | "warn" | "good" | "critical"; icon?: ReactNode }) {
  const tones = {
    info: "from-teal/10 to-teal/5 border-teal/20",
    warn: "from-amber/15 to-amber/5 border-amber/30",
    good: "from-success/10 to-success/5 border-success/20",
    critical: "from-danger/15 to-danger/5 border-danger/30",
  };
  const dot = {
    info: "bg-teal",
    warn: "bg-amber",
    good: "bg-success",
    critical: "bg-danger",
  };
  return (
    <div className={cn("relative rounded-2xl border bg-gradient-to-br p-5 overflow-hidden", tones[tone])}>
      <div className="flex items-start gap-3">
        <div className={cn("h-9 w-9 grid place-items-center rounded-xl bg-card shadow-sm shrink-0", dot[tone] + "/10")}>
          {icon ?? <Sparkles className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse-soft", dot[tone])} />
            AI Insight
          </div>
          <h3 className="font-display text-lg mt-0.5 text-balance">{title}</h3>
          <div className="text-sm text-foreground/80 mt-2 leading-relaxed text-pretty">{children}</div>
        </div>
      </div>
    </div>
  );
}
