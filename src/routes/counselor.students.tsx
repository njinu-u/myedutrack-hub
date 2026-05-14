import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
const m = (title: string, subtitle: string, sections: any[]) => () => <ModulePage title={title} subtitle={subtitle} sections={sections} />;
export const Route = createFileRoute("/counselor/students")({ component: m("My Students", "Caseload of students under active counselor support.", [
  { title: "Caseload overview", body: "See every student you support, sorted by risk level." },
  { title: "Last contact", body: "When you last met or messaged each student." },
  { title: "Confidential notes", body: "Private notes only visible to counselors." },
  { title: "Family context", body: "Background, language, prior interventions." },
])});
