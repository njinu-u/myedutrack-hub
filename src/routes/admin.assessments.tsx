import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
export const Route = createFileRoute("/admin/assessments")({ component: () => <ModulePage title="Assessments" subtitle="Build, schedule, and grade assessments across all classes." sections={[
  { chip: "Item bank", title: "Reusable question library", body: "Curriculum-aligned banks for IB, Cambridge and CBC. Tag by topic, difficulty, and Bloom level." },
  { chip: "Scheduling", title: "Term assessment calendar", body: "Conflict-aware scheduling — students never face two majors on the same day." },
  { chip: "Marking", title: "Rubric-based marking with AI assist", body: "AI suggests scores against the rubric; teachers approve. Cuts marking time by 60%." },
  { chip: "Insights", title: "Most-missed concept analysis", body: "After every assessment: which concept tripped most students, and which question revealed it." },
]} />)});
