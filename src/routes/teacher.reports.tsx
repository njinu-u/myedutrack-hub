import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
const m = (title: string, sections: any[]) => () => <ModulePage title={title} sections={sections} />;
export const Route = createFileRoute("/teacher/reports")({ component: m("Reports", [
  { title: "AI-drafted narratives", body: "AI writes the first draft from your data — you refine the voice." },
  { title: "Bulk generate", body: "Generate a whole class in one click; review individually." },
])});
