import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
const m = (title: string, subtitle: string, sections: any[]) => () => <ModulePage title={title} subtitle={subtitle} sections={sections} />;
export const Route = createFileRoute("/teacher/classes")({ component: m("My Classes", "All classes you teach this term.", [
  { title: "Roster", body: "Photo grid of every student in each class — tap to open profile." },
  { title: "Engagement", body: "Per-class engagement scores and weekly trend." },
  { title: "Plan", body: "Linked unit plan, upcoming assessments, lesson resources." },
  { title: "Differentiate", body: "AI suggests groupings based on current performance data." },
])});
