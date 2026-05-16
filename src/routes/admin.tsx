import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalLayout } from "@/components/portal-layout";
import type { Role } from "@/lib/mock-data";
import { ADMIN_NAV } from "@/lib/portal-nav";
import { useAuth } from "@/lib/auth";

export function usePortalGuard(role: Role) {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (auth.loading) return;
    if (auth.isAuthed) {
      // Authed users land on their actual portal regardless of URL
      if (auth.effectiveRole && auth.effectiveRole !== role) {
        navigate({ to: `/${auth.effectiveRole}` as "/admin" });
      }
      return;
    }
    // Demo / no auth — set the role flag so the demo content matches the URL
    if (auth.role !== role) auth.setRole(role);
  }, [auth.loading, auth.isAuthed, auth.effectiveRole, auth.role, role]);
}

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Portal — EduTrack" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  usePortalGuard("admin");
  return (
    <PortalLayout role="admin" nav={ADMIN_NAV} brandSubtitle="School Management">
      <Outlet />
    </PortalLayout>
  );
}
