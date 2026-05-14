import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalLayout } from "@/components/portal-layout";
import { COUNSELOR_NAV } from "@/lib/portal-nav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/counselor")({
  head: () => ({ meta: [{ title: "Counselor Portal — EduTrack" }] }),
  component: Layout,
});
function Layout() {
  const auth = useAuth();
  useEffect(() => { auth.setRole("counselor"); }, []);
  return <PortalLayout role="counselor" nav={COUNSELOR_NAV} brandSubtitle="Wellbeing & Intervention"><Outlet /></PortalLayout>;
}
