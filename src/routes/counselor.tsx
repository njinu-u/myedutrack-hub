import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal-layout";
import { COUNSELOR_NAV } from "@/lib/portal-nav";
import { usePortalGuard } from "./admin";

export const Route = createFileRoute("/counselor")({
  head: () => ({ meta: [{ title: "Counselor Portal — EduTrack" }] }),
  component: Layout,
});
function Layout() {
  usePortalGuard("counselor");
  return <PortalLayout role="counselor" nav={COUNSELOR_NAV} brandSubtitle="Wellbeing & Intervention"><Outlet /></PortalLayout>;
}
