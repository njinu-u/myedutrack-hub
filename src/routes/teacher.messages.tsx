import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
const m = (title: string, sections: any[]) => () => <ModulePage title={title} sections={sections} />;
export const Route = createFileRoute("/teacher/messages")({ component: m("Parent Messages", [
  { title: "Threaded conversations", body: "One thread per student; AI suggests replies; auto-translated." },
  { title: "Drafting assistant", body: "Ask AI: 'Draft a message about Kofi's math grade' — refine and send." },
  { title: "Read receipts", body: "Know when a parent has seen your message." },
])});
