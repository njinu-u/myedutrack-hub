import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
export const Route = createFileRoute("/admin/timetable")({ component: () => <ModulePage title="Timetable" subtitle="Drag-and-drop scheduling with constraint solving." sections={[
  { title: "Auto-generate", body: "Solver builds conflict-free timetables in seconds based on rooms, teacher availability, and student electives." },
  { title: "Live view", body: "See exactly which classes are running right now, school-wide." },
  { title: "Substitute cover", body: "AI suggests cover teachers based on subject expertise and current free periods." },
  { title: "Multi-campus", body: "Run distinct timetables per campus from one console." },
]} /> });
