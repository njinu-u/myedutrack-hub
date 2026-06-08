import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Globe2, Smartphone, Sparkles, Zap, MessageCircle, ShieldCheck, Download, Languages } from "lucide-react";
import { SCHOOL_DOTS } from "@/lib/mock-data";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduTrack International — The school operating system that thinks" },
      { name: "description", content: "Every student seen. Every family connected. Every decision informed. AI-powered school OS built for international schools." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="bg-background">
      <Nav />
      <Hero />
      <Problem />
      <LiveDemo />
      <Portals />
      <Devices />
      <Pricing />
      <Africa />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-navy grid place-items-center text-white font-display font-bold">E</div>
          <span className="font-display text-xl tracking-tight">EduTrack</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#portals" className="hover:text-foreground">Portals</a>
          <a href="#problem" className="hover:text-foreground">The shift</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <Link to="/demo" className="hover:text-foreground">Demo</Link>
        </nav>
        <div className="flex items-center gap-2">
          <button className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border hover:bg-secondary"><Download className="h-3.5 w-3.5" /> Install</button>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-navy text-white hover:opacity-90">Sign in <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden gradient-hero text-white grain">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,white/10,transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 stagger">
          <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse-soft" />
            Built in Nairobi · for the world's mobile students
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] mt-6 text-balance">
            The school operating system <em className="text-amber not-italic">that thinks.</em>
          </h1>
          <p className="text-lg md:text-xl text-white/75 mt-6 max-w-xl text-pretty">
            Every student seen. Every family connected. Every decision informed. EduTrack unifies academics, attendance, wellbeing and parent communication — and adds an AI co-pilot that turns it all into action.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-amber text-navy font-medium hover:scale-[1.02] transition shadow-elevated">
              Start free pilot <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/demo" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/15">
              See a live demo
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-xs text-white/60">
            <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> FERPA & GDPR aligned</div>
            <div className="flex items-center gap-1.5"><Languages className="h-3.5 w-3.5" /> 15+ languages</div>
            <div className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> Installable PWA</div>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <WorldMap />
        </div>
      </div>
    </section>
  );
}

function WorldMap() {
  return (
    <div className="relative aspect-[5/4] rounded-3xl glass-dark overflow-hidden p-6">
      <div className="text-xs uppercase tracking-[0.25em] text-white/50">Live · Schools using EduTrack</div>
      <svg viewBox="0 0 100 65" className="w-full h-[85%] mt-4">
        {/* schematic continents */}
        <g fill="oklch(1 0 0 / 0.06)" stroke="oklch(1 0 0 / 0.1)" strokeWidth="0.2">
          <path d="M10,20 L30,18 L35,28 L28,40 L18,42 L8,32 Z" />
          <path d="M40,15 L52,14 L58,22 L55,30 L46,32 L42,24 Z" />
          <path d="M50,30 L62,30 L68,42 L60,52 L52,48 L46,38 Z" />
          <path d="M60,18 L78,20 L85,28 L82,40 L70,42 L62,34 Z" />
          <path d="M75,42 L88,44 L90,55 L78,58 L72,52 Z" />
        </g>
        {SCHOOL_DOTS.map((d, i) => (
          <g key={d.name} style={{ animationDelay: `${i * 0.3}s` }}>
            <circle cx={d.x} cy={d.y} r="0.6" fill="var(--color-amber)" />
            <circle cx={d.x} cy={d.y} r="2.5" fill="var(--color-amber)" opacity="0.3" className="animate-pulse-soft" />
            <text x={d.x + 1.5} y={d.y + 0.6} fontSize="2" fill="oklch(1 0 0 / 0.7)" fontFamily="sans-serif">{d.name}</text>
          </g>
        ))}
      </svg>
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[11px] text-white/60">
        <span>7 cities · 24 schools</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse-soft" />pulsing = active today</span>
      </div>
    </div>
  );
}

function Problem() {
  return (
    <section id="problem" className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-[0.25em] text-teal">The shift</div>
          <h2 className="font-display text-4xl md:text-5xl mt-4 text-balance">From record-keeping to <em className="text-teal not-italic">student understanding</em>.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-14">
          <div className="rounded-2xl p-8 border-2 border-dashed border-border bg-card/50">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">The old way</div>
            <ul className="mt-4 space-y-3 text-foreground/70">
              {["Spreadsheets in 5 places","Reports take 3 weeks to write","Parents see nothing until term end","At-risk students discovered too late","Counselors operate on intuition","New transfers start from zero"].map((t) => (
                <li key={t} className="flex gap-2"><span className="text-danger mt-0.5">×</span> {t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-8 bg-navy text-white shadow-elevated relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber/20 blur-3xl" />
            <div className="text-xs uppercase tracking-wider text-amber relative">The EduTrack way</div>
            <ul className="mt-4 space-y-3 relative">
              {["One place. Five portals. Real-time data.","AI drafts reports — teachers refine in minutes","Parents see weekly plain-language summaries","Students flagged the moment patterns shift","Counselors get full causal chains","Records follow students across schools"].map((t) => (
                <li key={t} className="flex gap-2"><Check className="h-4 w-4 text-amber mt-0.5" /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const SCENARIOS = [
  {
    label: "Generate a parent report",
    text: "Kofi has had a mixed month. His science and English grades are strong — he's in the top third of his class. Math has been a challenge: his last three assessments show a decline, and his teacher has flagged this. Socially, he's settling in well and his mood has been mostly positive. We recommend reviewing the resource pack we've sent and asking Kofi how he feels about math class.",
  },
  {
    label: "Explain a grade decline",
    text: "Three drivers correlate with the Grade 7 Math drop: (1) shift to algebraic expressions in week 4, (2) a 9-day teacher substitution in section 7B, (3) reduced homework completion across the cohort. Confidence: 0.81. Recommended: targeted re-teach of unit 4, peer-tutoring for 6 named students, parent communication template prepared.",
  },
  {
    label: "Suggest an intervention",
    text: "Diego presents an early-stage disengagement profile. Similar profiles in our anonymised cohort responded best to: peer mentor pairing (8 weeks), reduced assessment pressure window (4 weeks), and twice-weekly counselor check-ins. Expected probability of attendance recovery: 72%. Family liaison call recommended within 5 days.",
  },
];

function LiveDemo() {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    const text = SCENARIOS[idx].text;
    let i = 0;
    const t = setInterval(() => {
      i += 3;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, [idx]);

  return (
    <section className="py-20 lg:py-28 bg-secondary/40">
      <div className="max-w-6xl mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-5">
          <div className="text-xs uppercase tracking-[0.25em] text-teal">Live AI demo</div>
          <h2 className="font-display text-4xl md:text-5xl mt-3 text-balance">Pick a scenario. Watch it write.</h2>
          <p className="text-muted-foreground mt-4">Every word draws from real student data — grades, attendance, observations, mood check-ins, parent messages. Teachers stay in control. The AI just removes the blank page.</p>
          <div className="mt-6 flex flex-col gap-2">
            {SCENARIOS.map((s, i) => (
              <button key={s.label} onClick={() => setIdx(i)} className={`text-left px-4 py-3 rounded-xl text-sm transition border ${idx === i ? "bg-navy text-white border-navy" : "bg-card hover:bg-secondary border-border"}`}>
                <span className="font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-card border shadow-elevated overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center gap-2 bg-secondary/50">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              </div>
              <div className="text-xs text-muted-foreground ml-2">EduTrack AI · drafting</div>
              <Sparkles className="h-3.5 w-3.5 text-teal ml-auto animate-pulse-soft" />
            </div>
            <div className="p-6 min-h-[280px] font-serif text-lg leading-relaxed text-foreground/90">
              {shown}<span className="inline-block w-1.5 h-5 bg-teal align-middle ml-0.5 animate-pulse-soft" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PORTALS = [
  { id: "admin", title: "Admin", desc: "Run the whole school from one screen — KPIs, AI alerts, projections.", color: "from-[oklch(0.55_0.15_260)] to-[oklch(0.4_0.13_260)]" },
  { id: "teacher", title: "Teacher", desc: "Grades, observations, AI lesson plans, parent messages — under one roof.", color: "from-teal to-[oklch(0.45_0.13_200)]" },
  { id: "counselor", title: "Counselor", desc: "Wellbeing radar, intervention tracking, AI risk reports with causal chains.", color: "from-[oklch(0.65_0.13_320)] to-[oklch(0.5_0.13_320)]" },
  { id: "parent", title: "Parent", desc: "Plain-language summaries, weekly. Auto-translated. WhatsApp-friendly.", color: "from-[oklch(0.7_0.13_35)] to-[oklch(0.55_0.15_35)]" },
  { id: "student", title: "Student", desc: "AI grade coach, mood check-in, growth timeline. Built to motivate.", color: "from-[oklch(0.65_0.16_145)] to-[oklch(0.5_0.14_160)]" },
];

function Portals() {
  return (
    <section id="portals" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-teal">Five portals · one truth</div>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-balance max-w-2xl">Every stakeholder sees what they need. <em className="not-italic text-teal">Nothing more.</em></h2>
          </div>
          <Link to="/login" className="text-sm inline-flex items-center gap-1.5 text-teal hover:gap-2 transition-all">Try a portal <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mt-12">
          {PORTALS.map((p) => (
            <Link key={p.id} to={`/${p.id}` as "/admin"} className={`group rounded-2xl p-6 bg-gradient-to-br text-white relative overflow-hidden hover:-translate-y-1 transition-transform shadow-elevated ${p.color}`}>
              <div className="text-xs uppercase tracking-wider opacity-70">Portal</div>
              <h3 className="font-display text-2xl mt-1">{p.title}</h3>
              <p className="text-sm opacity-80 mt-3">{p.desc}</p>
              <ArrowRight className="h-4 w-4 mt-6 opacity-60 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Devices() {
  return (
    <section className="py-24 bg-navy text-white relative overflow-hidden grain">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-teal/30 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber/20 blur-3xl" />
      <div className="relative max-w-6xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-amber">Works on any device</div>
          <h2 className="font-display text-4xl md:text-5xl mt-3 text-balance">Install once. <em className="text-amber not-italic">Works offline.</em></h2>
          <p className="text-white/70 mt-4">A real progressive web app. Add to home screen on Android or iOS in seconds. Cached data is available even when the internet isn't.</p>
          <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/5 p-4 border border-white/10"><div className="font-medium">Android</div><div className="text-white/60 mt-1">Chrome → ⋮ → Install app</div></div>
            <div className="rounded-xl bg-white/5 p-4 border border-white/10"><div className="font-medium">iOS</div><div className="text-white/60 mt-1">Share → Add to Home Screen</div></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[{ icon: Smartphone, label: "Mobile" },{ icon: Globe2, label: "Tablet" },{ icon: Zap, label: "Desktop" }].map((D) => (
            <div key={D.label} className="aspect-[3/4] rounded-2xl glass-dark p-4 flex flex-col justify-between">
              <D.icon className="h-6 w-6 text-amber" />
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">Optimized</div>
                <div className="font-display text-xl">{D.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    { name: "Free Pilot", price: "$0", period: "12-week pilot", description: "", features: ["Up to 50 students","All 5 portals","Email support"], cta: "Start pilot", featured: false },
    { name: "School", price: "$50", period: "flat annual fee", description: "One simple price for your whole school. No per-student counting. No surprises.", features: ["Unlimited staff","Full AI co-pilot","WhatsApp delivery","Multi-language reports","Priority support"], cta: "Get Started", featured: true },
    { name: "District", price: "Custom", period: "10+ schools", description: "", features: ["Cross-school analytics","Dedicated success manager","Single sign-on","Custom integrations"], cta: "Contact sales", featured: false },
  ];
  return (
    <section id="pricing" className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-[0.25em] text-teal">Simple pricing</div>
          <h2 className="font-display text-4xl md:text-5xl mt-3">$50 per school. <em className="not-italic text-teal">Per year.</em></h2>
          <p className="text-muted-foreground mt-4">No setup fees. No per-seat charges for staff. No surprise add-ons.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mt-14">
          {tiers.map((t) => (
            <div key={t.name} className={`rounded-2xl p-7 border relative ${t.featured ? "bg-navy text-white border-navy shadow-elevated -mt-4" : "bg-card border-border"}`}>
              <div className={`text-xs uppercase tracking-wider ${t.featured ? "text-amber" : "text-teal"}`}>{t.name}</div>
              <div className="font-display text-5xl mt-3">{t.price}</div>
              <div className={`text-xs ${t.featured ? "text-white/60" : "text-muted-foreground"}`}>{t.period}</div>
              {t.description && <p className={`text-sm mt-3 ${t.featured ? "text-white/80" : "text-muted-foreground"}`}>{t.description}</p>}
              <ul className={`mt-6 space-y-2 text-sm ${t.featured ? "text-white/85" : ""}`}>
                {t.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-teal mt-0.5 shrink-0" /> {f}</li>)}
              </ul>
              <Link to="/login" className={`mt-6 block text-center px-4 py-2.5 rounded-full text-sm font-medium ${t.featured ? "bg-amber text-navy" : "bg-foreground text-background"}`}>{t.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Africa() {
  return (
    <section className="py-20 bg-amber/10">
      <div className="max-w-5xl mx-auto px-5 lg:px-8 grid md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2">
          <div className="text-xs uppercase tracking-[0.25em] text-amber">Built for Africa & Asia first</div>
          <h2 className="font-display text-3xl md:text-4xl mt-3">WhatsApp-first. Low-bandwidth. Multilingual.</h2>
          <p className="text-foreground/70 mt-3">From Nairobi to Mumbai to Jakarta — schools where the world shows up. We built EduTrack for the realities of patchy connectivity and busy parents who live in WhatsApp.</p>
        </div>
        <a href="https://wa.me/254700000000?text=Hi%20EduTrack%2C%20we%27d%20like%20to%20start%20a%20pilot%20for%20our%20school." target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-full bg-[#25D366] text-white font-medium hover:opacity-90">
          <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-14 bg-navy text-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber grid place-items-center text-navy font-display font-bold">E</div>
            <span className="font-display text-xl">EduTrack International</span>
          </div>
          <p className="text-white/60 mt-4 max-w-sm">Proudly built in Nairobi for schools where the world shows up.</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50">Product</div>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li><Link to="/login">Sign in</Link></li>
            <li><Link to="/demo">Live demo</Link></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><Link to="/privacy">Privacy</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50">Contact</div>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>Nairobi, Kenya</li>
            <li><a href="mailto:christophernjinu@gmail.com" className="hover:text-white">christophernjinu@gmail.com</a></li>
            <li><a href="tel:+254743594460" className="hover:text-white">+254 743 594 460</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 mt-10 pt-6 border-t border-white/10 flex flex-wrap justify-between gap-3 text-xs text-white/50">
        <span>© {new Date().getFullYear()} EduTrack International</span>
        <span className="flex items-center gap-3">
          <Link to="/privacy" className="hover:text-white">Privacy</Link>
          <span>The school operating system that thinks.</span>
        </span>
      </div>
    </footer>
  );
}
