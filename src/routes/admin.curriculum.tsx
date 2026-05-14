import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
export const Route = createFileRoute("/admin/curriculum")({ component: () => <ModulePage title="Curriculum" subtitle="Map, plan, and align curricula across grades and frameworks." sections={[
  { title: "Curriculum mapping", body: "Visualize coverage of IB, Cambridge, CBC standards per subject and grade." },
  { title: "Unit plans", body: "Shared unit plan library — teachers borrow, adapt, contribute." },
  { title: "Vertical alignment", body: "Flag gaps between Grade 7 and Grade 8 in any subject." },
  { title: "Resource library", body: "Linked teaching resources, marking schemes, and exemplars per unit." },
]} /> });
