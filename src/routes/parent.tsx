import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalLayout } from "@/components/portal-layout";
import { PARENT_NAV } from "@/lib/portal-nav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/parent")({
  head: () => ({ meta: [{ title: "Parent Portal — EduTrack" }] }),
  component: Layout,
});
function Layout() {
  const auth = useAuth();
  useEffect(() => { auth.setRole("parent"); }, []);
  return <PortalLayout role="parent" nav={PARENT_NAV} brandSubtitle="Adwoa · Kofi's mother"><Outlet /></PortalLayout>;
}
