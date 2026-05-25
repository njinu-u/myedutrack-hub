import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal-layout";
import { PARENT_NAV } from "@/lib/portal-nav";
import { usePortalGuard, SubscriptionGate } from "./admin";

export const Route = createFileRoute("/parent")({
  head: () => ({ meta: [{ title: "Parent Portal — EduTrack" }] }),
  component: Layout,
});
function Layout() {
  usePortalGuard("parent");
  return (
    <PortalLayout role="parent" nav={PARENT_NAV} brandSubtitle="Adwoa · Kofi's mother">
      <SubscriptionGate role="parent"><Outlet /></SubscriptionGate>
    </PortalLayout>
  );
}
