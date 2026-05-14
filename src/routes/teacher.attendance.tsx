import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
const m = (title: string, sections: any[]) => () => <ModulePage title={title} sections={sections} />;
export const Route = createFileRoute("/teacher/attendance")({ component: m("Attendance", [
  { title: "Quick register", body: "One-tap per student. Works offline. Syncs when online." },
  { title: "Period attendance", body: "Track late arrivals and period-by-period absence." },
])});
