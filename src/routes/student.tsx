import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal-layout";
import { STUDENT_NAV } from "@/lib/portal-nav";
import { usePortalGuard, SubscriptionGate } from "./admin";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Student Portal — EduTrack" }] }),
  component: Layout,
});
function Layout() {
  usePortalGuard("student");
  return (
    <PortalLayout role="student" nav={STUDENT_NAV}>
      <SubscriptionGate role="student"><Outlet /></SubscriptionGate>
    </PortalLayout>
  );
}
