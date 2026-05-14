import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalLayout } from "@/components/portal-layout";
import { ADMIN_NAV } from "@/lib/portal-nav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Portal — EduTrack" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (auth.role && auth.role !== "admin") auth.setRole("admin"); else if (!auth.role) auth.setRole("admin"); }, []);
  return (
    <PortalLayout role="admin" nav={ADMIN_NAV} brandSubtitle="School Management">
      <Outlet />
    </PortalLayout>
  );
}
