import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal-layout";
import { TEACHER_NAV } from "@/lib/portal-nav";
import { usePortalGuard, SubscriptionGate } from "./admin";

export const Route = createFileRoute("/teacher")({
  head: () => ({ meta: [{ title: "Teacher Portal — EduTrack" }] }),
  component: Layout,
});
function Layout() {
  usePortalGuard("teacher");
  return (
    <PortalLayout role="teacher" nav={TEACHER_NAV} brandSubtitle="Ms. Odhiambo · Math">
      <SubscriptionGate role="teacher"><Outlet /></SubscriptionGate>
    </PortalLayout>
  );
}
