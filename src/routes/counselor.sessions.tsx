import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
const m = (title: string, sections: any[]) => () => <ModulePage title={title} sections={sections} />;
export const Route = createFileRoute("/counselor/sessions")({ component: m("Session Notes", [
  { title: "Encrypted notes", body: "Counselor-only encrypted session notes per student." },
  { title: "Theme tags", body: "Tag themes to surface patterns across the cohort." },
])});
