import Link from "next/link";

const FEATURES = [
  {
    icon: "⚡",
    title: "Parallel stealth scraping",
    desc: "All domains run simultaneously in isolated stealth browser sessions. 10 companies in the same time as 1.",
  },
  {
    icon: "🔍",
    title: "Bypasses bot detection",
    desc: "Greenhouse, Lever, Workday, and custom career pages actively block scrapers. We get through anyway.",
  },
  {
    icon: "🧠",
    title: "AI-powered extraction",
    desc: "Structured data, not a wall of text. Tech stack, open roles, hiring velocity, funding stage, key signals.",
  },
  {
    icon: "📤",
    title: "Export & history",
    desc: "All past runs saved locally. Export any snapshot to CSV for your CRM, outreach tool, or spreadsheet.",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Paste domains", desc: "One per line. Any format — stripe.com, https://vercel.com, whatever." },
  { step: "2", title: "Hyperbrowser opens parallel sessions", desc: "Each domain gets its own stealth browser. Homepage, careers page, about page — all scraped simultaneously." },
  { step: "3", title: "AI extracts the signal", desc: "Tech stack from job requirements. Hiring velocity from role count. Key signals from copy and announcements." },
  { step: "4", title: "You get a live table", desc: "Results stream in as each domain finishes. Filter, sort, expand, export." },
];

const USECASES = [
  { role: "Sales", desc: "Spot companies scaling engineering before your competitor does. Personalize outreach with real stack data." },
  { role: "Recruiting", desc: "Find companies hiring in your niche. See exactly what skills they need before you reach out." },
  { role: "Investors", desc: "Quick diligence on a list of prospects. Hiring velocity and tech stack as leading indicators." },
  { role: "Founders", desc: "Monitor competitors. Know when they hire, what they're building, and where they're expanding." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="font-bold tracking-tight text-white">ProspectIQ</span>
        <div className="flex items-center gap-4">
          <a href="#how" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">How it works</a>
          <a href="#usecases" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Use cases</a>
          <Link
            href="/app"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Try it free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          Powered by Hyperbrowser · stealth parallel scraping
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
          Company intel,<br />
          <span className="text-emerald-400">from the live web</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Paste any list of company domains. ProspectIQ scrapes their websites and
          careers pages in parallel — bypassing bot detection — and returns structured
          intelligence: tech stack, open roles, hiring velocity, key signals.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/app"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base px-8 py-3.5 rounded-xl transition-colors"
          >
            Enrich companies →
          </Link>
          <a
            href="#how"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 font-medium text-base px-8 py-3.5 rounded-xl transition-colors"
          >
            See how it works
          </a>
        </div>

        {/* Demo domains */}
        <div className="mt-16 flex flex-wrap gap-2 justify-center">
          {["stripe.com", "linear.app", "vercel.com", "anthropic.com", "hyperbrowser.ai", "clerk.com"].map(d => (
            <span key={d} className="bg-gray-900 border border-gray-800 text-gray-500 text-xs px-3 py-1.5 rounded-full">
              {d}
            </span>
          ))}
          <span className="text-gray-700 text-xs px-3 py-1.5">→ structured intel in seconds</span>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-gray-800 bg-gray-900/40">
        <div className="max-w-5xl mx-auto px-6 py-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map(f => (
            <div key={f.title}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold mb-12 text-center">How it works</h2>
        <div className="space-y-6">
          {HOW_IT_WORKS.map(s => (
            <div key={s.step} className="flex gap-5 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-sm font-bold flex items-center justify-center shrink-0">
                {s.step}
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section id="usecases" className="border-t border-gray-800 bg-gray-900/40">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Who uses this</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {USECASES.map(u => (
              <div key={u.role} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="font-semibold text-emerald-400 mb-2">{u.role}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to enrich your pipeline?</h2>
        <p className="text-gray-400 mb-8">Free to try. Just bring your Hyperbrowser API key.</p>
        <Link
          href="/app"
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base px-10 py-4 rounded-xl transition-colors inline-block"
        >
          Start enriching →
        </Link>
      </section>

      <footer className="border-t border-gray-800 px-6 py-6 text-center text-xs text-gray-600">
        Built with{" "}
        <a href="https://www.hyperbrowser.ai" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-500">
          Hyperbrowser
        </a>{" "}
        · ProspectIQ
      </footer>
    </div>
  );
}
