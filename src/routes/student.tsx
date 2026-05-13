import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalLayout } from "@/components/portal-layout";
import { STUDENT_NAV } from "@/lib/portal-nav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Student Portal — EduTrack" }] }),
  component: Layout,
});
function Layout() {
  const auth = useAuth();
  useEffect(() => { auth.setRole("student"); }, []);
  return <PortalLayout role="student" nav={STUDENT_NAV} brandSubtitle="Kofi Mensah · Grade 7"><Outlet /></PortalLayout>;
}
