import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  MapPin, Hexagon, FlaskConical, Wheat, BarChart3, QrCode,
  Smartphone, Download, Shield, Check, ChevronRight,
  Star, Bell, CloudOff, Globe,
} from "lucide-react";

export const metadata = {
  title: "HiveTrack — Smart Beekeeping Management",
  description:
    "Manage your apiaries, track hive health, log visits, record harvests and treatments — all in one place. Built for hobbyists and professional beekeepers alike.",
};

/* ── tiny helpers ─────────────────────────────────────────────────────────── */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-600">
      {children}
    </p>
  );
}

/* ── data ─────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: MapPin,
    title: "Apiary Management",
    desc: "Organise multiple apiaries on an interactive map. Store GPS coordinates, notes and photos for every location.",
  },
  {
    icon: Hexagon,
    title: "Hive Tracking",
    desc: "Keep a detailed profile for each hive — queen status, colony strength, health score and full inspection history.",
  },
  {
    icon: FlaskConical,
    title: "Treatment Logs",
    desc: "Record varroa treatments, medications and schedules. Get automatic reminders before end-dates expire.",
  },
  {
    icon: Wheat,
    title: "Harvest Records",
    desc: "Log honey, wax and pollen yields per apiary. Visualise seasonal production trends with beautiful charts.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "At-a-glance stats: hives needing attention, upcoming tasks, visits per week and harvest-per-apiary breakdowns.",
  },
  {
    icon: QrCode,
    title: "QR Code Labels",
    desc: "Generate printable QR labels for every hive. Scan on-site with your phone to pull up the full history instantly.",
  },
  {
    icon: Download,
    title: "CSV / JSON Export",
    desc: "Export all your data at any time in CSV or JSON. Your records belong to you — no lock-in, ever.",
  },
  {
    icon: CloudOff,
    title: "Offline-Ready",
    desc: "Log visits and record treatments even without signal. Data syncs automatically when you're back online.",
  },
  {
    icon: Smartphone,
    title: "Mobile-Friendly",
    desc: "Fully responsive across phones, tablets and desktops. No app install needed — works straight from the browser.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Add your apiaries",
    desc: "Create locations for each of your bee yards. Pin them on a map and store access notes, climate info and more.",
  },
  {
    n: "02",
    title: "Register your hives",
    desc: "Add every hive inside each apiary. Assign a name, note the queen's birth year and set the starting health status.",
  },
  {
    n: "03",
    title: "Log every inspection",
    desc: "After each visit record what you saw — brood pattern, population, temperament, disease signs and any actions taken.",
  },
  {
    n: "04",
    title: "Track & improve",
    desc: "Review your dashboard to spot hives that need attention, upcoming treatment deadlines and year-over-year harvest trends.",
  },
];


const TESTIMONIALS = [
  {
    name: "Amina K.",
    role: "Hobbyist beekeeper · 8 hives",
    avatar: "🧑‍🌾",
    text: "I used to keep notes in a notebook that I'd inevitably lose. HiveTrack replaced that completely — I can check any hive's history from my phone while I'm standing right next to it.",
  },
  {
    name: "Carlos M.",
    role: "Semi-commercial · 60 hives",
    avatar: "👨‍🌾",
    text: "The treatment reminders are a game changer. I haven't missed a varroa treatment deadline since I switched to HiveTrack. The harvest charts are a great bonus.",
  },
  {
    name: "Sophie L.",
    role: "Apiary owner · 120 hives",
    avatar: "👩‍🔬",
    text: "We moved from spreadsheets to HiveTrack across three sites. The QR labels mean any of my team can scan a hive and see exactly what was done last — no more confusion.",
  },
];

const FAQS = [
  {
    q: "Do I need to install anything?",
    a: "No. HiveTrack is a web app — it runs entirely in your browser on phones, tablets and computers. No download required.",
  },
  {
    q: "Can I use HiveTrack without an internet connection?",
    a: "Yes. The app caches your data locally so you can log visits and treatments offline. Everything syncs automatically when you reconnect.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted in transit and at rest. Authentication is handled by Supabase (row-level security). We never share your data with third parties.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. You can export all your records as CSV or JSON at any time from the Settings page. Your data always belongs to you.",
  },
];

/* ── page ─────────────────────────────────────────────────────────────────── */
export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <img src="/images/logo.png" alt="Logo" style={{ height: 36, width: "auto" }} />
            <span className="text-amber-600">HiveTrack</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-amber-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-amber-600 transition-colors">How it works</a>
            <a href="#faq" className="hover:text-amber-600 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors sm:inline-flex">
                  Log in
                </Link>
                <Link href="/register" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-white to-white py-20 md:py-32">
        {/* decorative honeycomb blobs */}
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-amber-100/60 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-40 -left-20 h-[300px] w-[300px] rounded-full bg-amber-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
          <Badge>🍯 Built for beekeepers, by beekeepers</Badge>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
            Manage every hive,<br />
            <span className="text-amber-500">every visit, every harvest.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500 md:text-xl">
            HiveTrack is the all-in-one platform for beekeepers — from a single backyard hive
            to a full commercial apiary. Track health, treatments, harvests and more from
            any device, even offline.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-amber-200 hover:bg-amber-600 transition-colors"
            >
              Start now <ChevronRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 hover:border-amber-300 hover:text-amber-600 transition-colors"
            >
              See how it works
            </a>
          </div>

          <p className="mt-4 text-xs text-slate-400">No credit card required</p>

          {/* hero visual */}
          <div className="mt-16 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200">
            <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-slate-400">app.hivetrack.io/dashboard</span>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 sm:grid-cols-4">
              {[
                { label: "Active Hives", value: "24", icon: "🐝" },
                { label: "Apiaries", value: "3", icon: "📍" },
                { label: "Need Attention", value: "2", icon: "⚠️" },
                { label: "Treatments Due", value: "1", icon: "💊" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
                  <div className="text-xl">{s.icon}</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 bg-slate-50 px-4 pb-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-slate-700">Visits per week</p>
                <div className="flex items-end gap-1 h-16">
                  {[3, 5, 2, 7, 4, 6, 8, 5, 3, 9, 6, 7].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-amber-400"
                      style={{ height: `${(h / 9) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-slate-700">Upcoming tasks</p>
                <div className="space-y-2">
                  {[
                    { label: "Oxalic acid treatment — Hive 4", date: "Apr 15", color: "bg-red-100 text-red-700" },
                    { label: "Harvest check — North Apiary", date: "Apr 18", color: "bg-amber-100 text-amber-700" },
                    { label: "Queen check — Hive 11", date: "Apr 22", color: "bg-blue-100 text-blue-700" },
                  ].map((t) => (
                    <div key={t.label} className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-slate-600">{t.label}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${t.color}`}>{t.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section className="border-y border-slate-100 bg-slate-50 py-8">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
          <p className="mb-6 text-sm font-medium text-slate-400 uppercase tracking-widest">Trusted by beekeepers managing</p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-600">
            {[
              { n: "1,200+", label: "Hives tracked" },
              { n: "340+", label: "Active beekeepers" },
              { n: "8,500+", label: "Visits logged" },
              { n: "4.9 ★", label: "Average rating" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold text-amber-600">{s.n}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="text-center">
            <SectionLabel>Everything you need</SectionLabel>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              One platform for your entire apiary
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-500">
              From the first inspection to the last jar of honey — HiveTrack covers every
              part of your beekeeping operation.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 group-hover:bg-amber-100 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-gradient-to-b from-amber-50 to-white py-24">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="text-center">
            <SectionLabel>Simple workflow</SectionLabel>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Up and running in minutes
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-500">
              No training required. If you can use a smartphone you can use HiveTrack.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.n} className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-lg font-black text-white shadow-lg shadow-amber-200">
                  {step.n}
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlight callout ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="overflow-hidden rounded-3xl bg-amber-500 px-8 py-12 md:px-16">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-extrabold text-white md:text-3xl">
                  Never miss a hive that needs attention again.
                </h2>
                <p className="mt-3 text-amber-100">
                  HiveTrack automatically flags hives that haven't been visited in over 14 days
                  and surfaces treatment deadlines on your dashboard every time you log in.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Bell, label: "Smart alerts for overdue visits" },
                  { icon: Shield, label: "Treatment deadline tracking" },
                  { icon: Globe, label: "Works on any device, anywhere" },
                  { icon: Download, label: "Export all your data anytime" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-start gap-2 rounded-xl bg-white/10 p-3 text-sm font-medium text-white backdrop-blur">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="text-center">
            <SectionLabel>What beekeepers say</SectionLabel>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Loved by beekeepers worldwide
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-slate-600">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <div className="text-center">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Common questions
            </h2>
          </div>

          <div className="mt-12 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {FAQS.map((faq) => (
              <div key={faq.q} className="px-6 py-5">
                <h3 className="font-semibold text-slate-900">{faq.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24">
        <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
          <img src="/images/logo.png" alt="Logo" style={{ height: 72, width: "auto", margin: "0 auto" }} />
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Ready to take control of your hives?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-slate-500">
            Join hundreds of beekeepers already using HiveTrack — no credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-amber-200 hover:bg-amber-600 transition-colors"
            >
              Register now <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 hover:border-amber-300 hover:text-amber-600 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-slate-900 py-12 text-slate-400">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                <img src="/images/logo.png" alt="Logo" style={{ height: 36, width: "auto" }} />
                <span className="text-amber-400">HiveTrack</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed">
                Smart beekeeping management for hobbyists and professionals alike.
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-amber-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-amber-400 transition-colors">How it works</a></li>
                <li><a href="#faq" className="hover:text-amber-400 transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register" className="hover:text-amber-400 transition-colors">Register</Link></li>
                <li><Link href="/login" className="hover:text-amber-400 transition-colors">Log in</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="cursor-default">Privacy Policy</span></li>
                <li><span className="cursor-default">Terms of Service</span></li>
                <li><span className="cursor-default">Cookie Policy</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-8 text-xs sm:flex-row">
            <p>© 2025 HiveTrack. All rights reserved.</p>
            <p>Built for beekeepers 🍯</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
