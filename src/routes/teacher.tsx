import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalLayout } from "@/components/portal-layout";
import { TEACHER_NAV } from "@/lib/portal-nav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/teacher")({
  head: () => ({ meta: [{ title: "Teacher Portal — EduTrack" }] }),
  component: Layout,
});
function Layout() {
  const auth = useAuth();
  useEffect(() => { auth.setRole("teacher"); }, []);
  return <PortalLayout role="teacher" nav={TEACHER_NAV} brandSubtitle="Ms. Odhiambo · Math"><Outlet /></PortalLayout>;
}
