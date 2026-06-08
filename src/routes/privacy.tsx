import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — EduTrack International" },
      { name: "description", content: "How EduTrack International collects, uses, stores and protects personal data for schools, staff, students and parents." },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

const UPDATED = "8 June 2026";

function PrivacyPage() {
  return (
    <div className="bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-5 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber grid place-items-center text-navy font-display font-bold">E</div>
            <span className="font-display">EduTrack International</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-12">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Legal</div>
        <h1 className="font-display text-4xl mt-2 tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2 text-sm">Last updated: {UPDATED}</p>

        <Section title="1. Who we are">
          EduTrack International (“EduTrack”, “we”, “our”) provides a school management platform used by international schools, their staff, students and parents. We are based in Nairobi, Kenya. For privacy questions, contact <a className="underline" href="mailto:christophernjinu@gmail.com">christophernjinu@gmail.com</a>.
        </Section>

        <Section title="2. The data we collect">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account data:</strong> name, email, phone, role (admin, teacher, counselor, parent, student), profile picture, the school you belong to.</li>
            <li><strong>School data:</strong> classes, subjects, student rosters, attendance, grades, assessments, observations, timetables and counselor notes you enter.</li>
            <li><strong>Communication data:</strong> messages, appointments and notifications sent through the platform.</li>
            <li><strong>Wellbeing data:</strong> student mood check-ins and counselor flags (sensitive — see §6).</li>
            <li><strong>Payment data:</strong> when a school subscribes, PayPal handles the card transaction. We store only the PayPal order ID, amount, payer email and subscription dates. We never see or store card numbers.</li>
            <li><strong>Technical data:</strong> IP address, browser, device, session tokens, and security event logs (sign-ins, role changes, failed payments).</li>
          </ul>
        </Section>

        <Section title="3. How we use your data">
          <ul className="list-disc pl-5 space-y-2">
            <li>To operate the school portal for your school.</li>
            <li>To authenticate users and enforce role-based access.</li>
            <li>To process subscription payments and send renewal reminders.</li>
            <li>To send transactional notifications (messages, attendance alerts, report cards).</li>
            <li>To generate AI-assisted summaries and observations when staff explicitly request them.</li>
            <li>To detect and investigate abuse, fraud and security incidents.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </Section>

        <Section title="4. Legal basis">
          We process data under (a) the contract between EduTrack and the subscribing school, (b) the school's legitimate interest in running its operations, (c) consent — for example when a parent enrolls or a counselor records a sensitive flag — and (d) legal obligation where applicable.
        </Section>

        <Section title="5. Who can see your data">
          Access is enforced at the database with Row-Level Security and is strictly scoped:
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>School admins see all data for their own school only.</li>
            <li>Teachers and counselors see only students in their assigned classes/case-loads.</li>
            <li>Parents see only their own linked child.</li>
            <li>Students see only their own profile, grades, attendance and mood records.</li>
            <li>EduTrack staff access production data only when required to provide support, fix a bug, or investigate a security event — and only with audit logging.</li>
          </ul>
          We do not sell personal data. We do not share data with advertisers.
        </Section>

        <Section title="6. Sensitive student data">
          Counselor flags, mood check-ins and wellbeing notes are treated as sensitive. They are visible only to the student themselves, the assigned counselor(s) and the school admin. They are never used to train AI models and are never shared with third parties.
        </Section>

        <Section title="7. Sub-processors">
          We use a small set of trusted infrastructure providers:
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Supabase</strong> — database, authentication and file storage.</li>
            <li><strong>Cloudflare</strong> — application hosting and DDoS protection.</li>
            <li><strong>PayPal</strong> — payment processing for school subscriptions.</li>
            <li><strong>Lovable AI Gateway</strong> — large-language-model access used only when staff explicitly invoke an AI feature.</li>
          </ul>
        </Section>

        <Section title="8. Where data is stored">
          Primary data is stored in Supabase's managed Postgres infrastructure. We aim to keep data in regions appropriate to our customer base; cross-border transfers are protected by standard contractual safeguards.
        </Section>

        <Section title="9. How long we keep data">
          We keep data for as long as your school remains an active subscriber, plus a retention window for backups and legal compliance. When a school ends its subscription, we will, on written request, export and then delete its data within 90 days, except where retention is required by law.
        </Section>

        <Section title="10. Security">
          We enforce Row-Level Security on every database table, encrypted connections, server-side validation of all payments, leaked-password detection on sign-up, audited role changes, and an internal security event log. No system is perfectly secure; if you suspect a breach, email us immediately.
        </Section>

        <Section title="11. Your rights">
          You can request to access, correct, export or delete your personal data. Parents can exercise these rights on behalf of their minor child. Email <a className="underline" href="mailto:christophernjinu@gmail.com">christophernjinu@gmail.com</a>. You may also complain to your local data protection authority.
        </Section>

        <Section title="12. Children">
          EduTrack is designed for use by schools. Student accounts are created and managed by the school. We do not market the service directly to children and we do not knowingly collect data from a child without the school's instruction.
        </Section>

        <Section title="13. Cookies & local storage">
          We use first-party cookies and local storage only for authentication sessions and to remember UI preferences (such as the selected portal). We do not use third-party advertising or tracking cookies.
        </Section>

        <Section title="14. Changes to this policy">
          We will update this page when our practices change. If the change is significant we will notify school admins by email.
        </Section>

        <Section title="15. Contact">
          EduTrack International<br />
          Nairobi, Kenya<br />
          <a className="underline" href="mailto:christophernjinu@gmail.com">christophernjinu@gmail.com</a>
        </Section>
      </main>

      <footer className="border-t mt-12 py-8">
        <div className="max-w-3xl mx-auto px-5 text-xs text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} EduTrack International</span>
          <Link to="/" className="hover:text-foreground">Home</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl tracking-tight">{title}</h2>
      <div className="mt-3 text-sm text-foreground/80 leading-relaxed">{children}</div>
    </section>
  );
}
