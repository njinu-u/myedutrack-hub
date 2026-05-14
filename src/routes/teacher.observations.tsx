import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
const m = (title: string, subtitle: string, sections: any[]) => () => <ModulePage title={title} subtitle={subtitle} sections={sections} />;
export const Route = createFileRoute("/teacher/observations")({ component: m("Observations", "Quick text, audio, or rubric notes that feed AI analysis.", [
  { title: "Text + audio notes", body: "Tap-and-hold to record voice observations — auto-transcribed." },
  { title: "Quick rubric", body: "1–5 scale: Engagement, Understanding, Participation, Behavior." },
  { title: "Tag taxonomy", body: "Academic · Social · Behavioral · Emotional · Physical · Language." },
  { title: "Timeline view", body: "See observation history per student in a single scroll." },
])});
