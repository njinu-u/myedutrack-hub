import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
const m = (title: string, subtitle: string, sections: any[]) => () => <ModulePage title={title} subtitle={subtitle} sections={sections} />;
export const Route = createFileRoute("/parent/messages")({ component: m("Communicate", "Stay in touch with Kofi's teachers in your language.", [
  { title: "Auto-translation", body: "Write in your language; teachers receive in English. Their replies arrive translated to you." },
  { title: "Response time", body: "See typical reply time per teacher so you know what to expect." },
  { title: "School announcements", body: "All school + class updates in one feed. Read receipts confirmed." },
  { title: "AI conversation starters", body: "Suggested topics based on what's happening in Kofi's week." },
])});
