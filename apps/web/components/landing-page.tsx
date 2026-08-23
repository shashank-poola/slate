import Link from "next/link";
import { ArrowUpRight, Check, FileText, Sparkles, UsersRound } from "lucide-react";
import { SiteHeader } from "./site-header";

const steps = [
  ["01", "Add your authors", "Bring together the people behind the work."],
  ["02", "Describe contributions", "Paste your free-text contribution and disclosure notes."],
  ["03", "Review with confidence", "Approve CRediT roles before they reach your manuscript."],
];

export const LandingPage = () => (
  <main className="min-h-svh bg-[#fdfdfc] text-[#171717]">
    <SiteHeader />

    <section className="mx-auto flex max-w-[980px] flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
      <div className="mb-8 flex h-24 w-48 items-center justify-center overflow-hidden rounded-[2rem] bg-[#e9f3ef] sm:h-28 sm:w-56">
        <div className="relative grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }).map((_, index) => (
            <span key={index} className={`size-3 rounded-sm border border-zinc-400 ${[1, 5, 6, 10, 14].includes(index) ? "bg-[#9edbc9]" : "bg-white/70"}`} />
          ))}
          <span className="absolute left-1 top-1 size-2 rounded-full bg-zinc-900" />
          <span className="absolute bottom-1 right-1 size-2 rounded-full bg-zinc-900" />
        </div>
      </div>
      <p className="mb-5 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">A Slate product · Research authorship, clarified</p>
      <h1 className="max-w-4xl font-[family-name:var(--font-display)] text-5xl leading-[0.96] tracking-[-0.045em] sm:text-7xl">
        Make every contribution count.
      </h1>
      <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
        Slate builds focused tools for research teams. Declare turns researcher notes into clear, reviewable CRediT contributor statements — without guessing what your team meant.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700">
          Get started <ArrowUpRight className="size-4" />
        </Link>
        <a href="#how-it-works" className="rounded-full bg-zinc-100 px-5 py-2.5 text-sm font-medium transition hover:bg-zinc-200">How it works</a>
      </div>
    </section>

    <section id="how-it-works" className="mx-auto grid max-w-[980px] gap-5 px-6 pb-28 md:grid-cols-3 sm:px-0">
      {steps.map(([number, title, description], index) => {
        const Icon = [UsersRound, Sparkles, FileText][index]!;
        return <article key={number} className="rounded-2xl bg-[#f2f2ef] p-6">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500"><span>{number}</span><Icon className="size-5 text-zinc-700" /></div>
          <h2 className="mt-16 text-xl font-medium tracking-tight">{title}</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-600">{description}</p>
        </article>;
      })}
    </section>

    <section id="about" className="border-y border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-[980px] gap-12 px-6 py-20 sm:px-0 md:grid-cols-[0.9fr_1.1fr]">
        <h2 className="font-[family-name:var(--font-display)] text-4xl leading-none tracking-[-0.035em]">Precise enough for publication.</h2>
        <div className="space-y-5 text-base leading-7 text-zinc-600">
          <p>Declare keeps ambiguous work ambiguous, so researchers can clarify it before a role is assigned.</p>
          <ul className="space-y-3 text-zinc-800">
            {["Built around the 14 CRediT contributor roles", "Funding and conflicts kept separate", "Final statements are generated from reviewed facts only"].map((item) => <li key={item} className="flex gap-3"><Check className="mt-1 size-4 text-zinc-500" />{item}</li>)}
          </ul>
        </div>
      </div>
    </section>

    <footer className="mx-auto flex max-w-[980px] flex-col gap-4 px-6 py-8 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-0">
      <span>© 2026 Slate. Research authorship, clearly declared.</span>
      <Link href="/dashboard" className="text-zinc-800 hover:underline">Open Declare</Link>
    </footer>
  </main>
);
