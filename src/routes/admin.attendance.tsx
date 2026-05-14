import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/module-page";
export const Route = createFileRoute("/admin/attendance")({ component: () => <ModulePage title="Attendance" subtitle="Daily registers, period attendance, and forecasting in one view." sections={[
  { chip: "Capture", title: "One-tap registers", body: "Teachers mark attendance in under 30 seconds — works offline, syncs when back online." },
  { chip: "Forecast", title: "Attendance forecasting", body: "Predict tomorrow's attendance per class with confidence intervals; flag risk patterns 7 days ahead." },
  { chip: "Notify", title: "Auto parent alert", body: "Unexcused absence triggers WhatsApp + in-app notification within 15 minutes." },
  { chip: "Patterns", title: "Pattern detection", body: "AI surfaces day-of-week patterns, route correlations, post-holiday dips." },
]} />)});
