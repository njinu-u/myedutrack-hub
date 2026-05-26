import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/mock-data";
import { LogOut, Menu, X, Bell, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface PortalLayoutProps {
  role: Role;
  nav: NavItem[];
  children: ReactNode;
  brandSubtitle?: string;
}

const ROLE_TINTS: Record<Role, { bg: string; chip: string; ring: string }> = {
  admin:    { bg: "from-[oklch(0.55_0.15_260)] to-[oklch(0.4_0.13_260)]", chip: "bg-[oklch(0.55_0.15_260)]/15 text-[oklch(0.45_0.15_260)]", ring: "ring-[oklch(0.55_0.15_260)]/30" },
  teacher:  { bg: "from-teal to-[oklch(0.45_0.13_200)]", chip: "bg-teal/15 text-teal", ring: "ring-teal/30" },
  counselor:{ bg: "from-[oklch(0.65_0.13_320)] to-[oklch(0.5_0.13_320)]", chip: "bg-[oklch(0.65_0.13_320)]/15 text-[oklch(0.5_0.13_320)]", ring: "ring-[oklch(0.65_0.13_320)]/30" },
  parent:   { bg: "from-[oklch(0.7_0.13_35)] to-[oklch(0.55_0.15_35)]", chip: "bg-[oklch(0.7_0.13_35)]/15 text-[oklch(0.5_0.15_35)]", ring: "ring-[oklch(0.7_0.13_35)]/30" },
  student:  { bg: "from-[oklch(0.65_0.16_145)] to-[oklch(0.5_0.14_160)]", chip: "bg-[oklch(0.7_0.16_145)]/15 text-[oklch(0.45_0.14_160)]", ring: "ring-[oklch(0.7_0.16_145)]/30" },
};

export function PortalLayout({ role, nav, children, brandSubtitle }: PortalLayoutProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const tint = ROLE_TINTS[role];
  const roleMeta = ROLES.find((r) => r.id === role)!;

  // Real users never see demo persona strings — always use their own profile.
  const liveSubtitle = auth.isAuthed
    ? (auth.appUser?.full_name ?? auth.appUser?.email ?? roleMeta.desc)
    : null;
  const displaySubtitle = liveSubtitle ?? brandSubtitle ?? roleMeta.desc;

  const initials = auth.isAuthed && auth.appUser?.full_name
    ? auth.appUser.full_name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("")
    : (role === "parent" ? "AM" : role === "student" ? "KM" : role === "teacher" ? "OD" : role === "counselor" ? "RW" : "AD");

  const handleLogout = async () => {
    if (auth.isAuthed) await auth.signOut();
    else auth.setRole(null);
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky lg:top-0 inset-y-0 left-0 z-40 w-72 bg-sidebar text-sidebar-foreground transform transition-transform lg:translate-x-0 flex flex-col h-screen",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className={cn("h-9 w-9 rounded-lg bg-gradient-to-br grid place-items-center font-display font-bold text-white", tint.bg)}>E</div>
            <div className="leading-tight">
              <div className="font-display text-lg tracking-tight">EduTrack</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60 truncate">{displaySubtitle}</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {nav.map((item) => {
            const active = path === item.to || (item.to !== `/${role}` && path.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  active
                    ? "bg-sidebar-accent text-white shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white",
                )}
              >
                <span className={cn("h-7 w-7 grid place-items-center rounded-md", active ? "bg-white/10" : "")}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className={cn("rounded-xl p-3 bg-gradient-to-br text-white", tint.bg)}>
            <div className="flex items-center gap-2 text-xs font-semibold opacity-90">
              <Sparkles className="h-3.5 w-3.5" /> AI Co-pilot
            </div>
            <p className="text-[11px] opacity-80 mt-1 leading-snug">Drawing insights from 482 students and 38 teachers.</p>
          </div>
          <button onClick={handleLogout} className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-sidebar-foreground/70 hover:text-white py-2 rounded-lg hover:bg-sidebar-accent/60">
            <LogOut className="h-3.5 w-3.5" /> Switch role
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 glass border-b">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <button className="lg:hidden p-2 -ml-2" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className={cn("hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium", tint.chip)}>
              <span>{roleMeta.emoji}</span> {roleMeta.label} portal
            </div>
            <div className="hidden md:flex items-center gap-2 ml-auto px-3 h-9 rounded-full bg-secondary text-sm text-muted-foreground w-72">
              <Search className="h-4 w-4" /><span>Search students, classes, reports…</span>
            </div>
            <div className="ml-auto md:ml-0 flex items-center gap-2">
              <button className="relative h-9 w-9 grid place-items-center rounded-full hover:bg-secondary">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber" />
              </button>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-navy to-teal grid place-items-center text-white text-xs font-semibold">
                {role === "parent" ? "AM" : role === "student" ? "KM" : role === "teacher" ? "OD" : role === "counselor" ? "RW" : "AD"}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-display tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1.5 text-pretty max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-card border border-border/70 shadow-soft p-5", className)}>
      {children}
    </div>
  );
}

export function Stat({ label, value, change, tone = "default" }: { label: string; value: string | number; change?: string; tone?: "default" | "good" | "warn" | "bad" }) {
  const toneCls = tone === "good" ? "text-success" : tone === "warn" ? "text-amber" : tone === "bad" ? "text-danger" : "text-muted-foreground";
  return (
    <Card>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-3xl mt-1.5">{value}</div>
      {change && <div className={cn("text-xs mt-1", toneCls)}>{change}</div>}
    </Card>
  );
}
