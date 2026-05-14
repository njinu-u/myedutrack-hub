import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
const m = (title: string, subtitle: string, sections: any[]) => () => <ModulePage title={title} subtitle={subtitle} sections={sections} />;
export const Route = createFileRoute("/counselor/interventions")({ component: m("Intervention Tracker", "Plan, log, and measure every support intervention.", [
  { title: "Plan", body: "Goal · actions · staff · timeline · review date." },
  { title: "Log sessions", body: "Confidential session notes — not visible to teachers." },
  { title: "Outcome tracking", body: "Compare metrics before vs after the intervention." },
  { title: "AI suggestion", body: "Anonymized similar-case data ranks expected impact of each option." },
])});
