import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
export const Route = createFileRoute("/admin/staff")({ component: () => <ModulePage title="Staff" subtitle="Manage teachers, counselors, and admin staff." sections={[
  { title: "Roster", body: "All staff with role, subjects, classes, and contract status." },
  { title: "Engagement scores", body: "AI-derived classroom engagement signals — celebrate strengths, support struggles." },
  { title: "PD tracking", body: "Log professional development hours, certifications, observations." },
  { title: "Scheduling", body: "Visualize teaching loads — flag overloads automatically." },
]} />)});
