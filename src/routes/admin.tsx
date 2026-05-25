import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalLayout } from "@/components/portal-layout";
import type { Role } from "@/lib/mock-data";
import { ADMIN_NAV } from "@/lib/portal-nav";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/use-subscription";
import { PaymentWall, NonAdminLockedWall, RenewalBanner } from "@/components/payment-wall";

export function usePortalGuard(role: Role) {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (auth.loading) return;
    if (auth.isAuthed) {
      if (auth.effectiveRole && auth.effectiveRole !== role) {
        navigate({ to: `/${auth.effectiveRole}` as "/admin" });
      }
      return;
    }
    if (auth.role !== role) auth.setRole(role);
  }, [auth.loading, auth.isAuthed, auth.effectiveRole, auth.role, role]);
}

/** Gates a real (non-demo) authed user's portal access based on subscription state. */
export function SubscriptionGate({ role, children }: { role: Role; children: React.ReactNode }) {
  const auth = useAuth();
  const sub = useSubscription();

  // Demo mode or not authed: pass through (demo data, no gates).
  if (!auth.isAuthed) return <>{children}</>;
  if (sub.isLoading || !sub.data) return <>{children}</>;
  const s = sub.data;

  if (role === "admin") {
    if (s.needsPayment) return <PaymentWall schoolName={s.schoolName} />;
    const showBanner = s.isPaid && s.daysUntilExpiry !== null && s.daysUntilExpiry <= 30 && s.daysUntilExpiry >= 0;
    return (
      <>
        {showBanner && <RenewalBanner days={s.daysUntilExpiry!} />}
        {children}
      </>
    );
  }

  if (s.lockedForNonAdmin) return <NonAdminLockedWall schoolName={s.schoolName} />;
  return <>{children}</>;
}

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Portal — EduTrack" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  usePortalGuard("admin");
  return (
    <PortalLayout role="admin" nav={ADMIN_NAV} brandSubtitle="School Management">
      <SubscriptionGate role="admin">
        <Outlet />
      </SubscriptionGate>
    </PortalLayout>
  );
}
