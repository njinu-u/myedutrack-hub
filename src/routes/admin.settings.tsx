import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
export const Route = createFileRoute("/admin/settings")({ component: () => <ModulePage title="Settings" subtitle="School profile, branding, integrations." sections={[
  { title: "School profile", body: "Name, logo, term dates, grading scale, language defaults." },
  { title: "Roles & permissions", body: "Granular control over who sees what." },
  { title: "Integrations", body: "Google Workspace, Microsoft 365, WhatsApp Business, Stripe." },
  { title: "Data export", body: "GDPR-compliant full data export per student or whole school." },
]} />)});
