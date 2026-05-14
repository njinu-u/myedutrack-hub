import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
const m = (title: string, sections: any[]) => () => <ModulePage title={title} sections={sections} />;
export const Route = createFileRoute("/student/reports")({ component: m("My reports", [
  { title: "Term reports", body: "A friendly, student-version of your term report — what your teachers said, in language that makes sense." },
  { title: "Share with parent", body: "You choose what to share with your parent." },
])});
