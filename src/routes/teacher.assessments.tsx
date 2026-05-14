import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
const m = (title: string, sections: any[]) => () => <ModulePage title={title} sections={sections} />;
export const Route = createFileRoute("/teacher/assessments")({ component: m("Assessments", [
  { title: "My assessments", body: "Build, schedule, and review assessments for your classes." },
  { title: "AI marking assist", body: "Suggested marks against rubric; you stay in control." },
]) });
