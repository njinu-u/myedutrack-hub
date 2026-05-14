import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
export const Route = createFileRoute("/admin/communication")({ component: () => <ModulePage title="Communication" subtitle="Announcements, broadcasts, and parent inbox in one place." sections={[
  { title: "Whole-school broadcast", body: "Send urgent updates via in-app + WhatsApp + email simultaneously." },
  { title: "Targeted segments", body: "Message a class, a grade, a nationality, or a custom segment." },
  { title: "Auto-translation", body: "Compose in English; parents receive in their preferred language." },
  { title: "Read receipts", body: "Track which families have seen which announcements." },
]} />)});
