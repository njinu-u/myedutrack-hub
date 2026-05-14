import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
const m = (title: string, subtitle: string, sections: any[]) => () => <ModulePage title={title} subtitle={subtitle} sections={sections} />;
export const Route = createFileRoute("/parent/resources")({ component: m("Resources", "Tools to help you support Kofi at home.", [
  { title: "AI homework helpers", body: "Curated short resources matching what Kofi is working on this week." },
  { title: "School calendar", body: "Term dates, holidays, exam schedule." },
  { title: "Parent learning hub", body: "How to support a child through transition · talking about exam anxiety · understanding IB grades." },
  { title: "Curriculum overview", body: "What your child is learning this term, by subject." },
])});
