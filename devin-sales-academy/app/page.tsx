import Link from "next/link";
import { NextStepCard } from "@/components/next-step-card";
import { lessons, modules, objections, personas, quizzes } from "@/content";
import { demoRecipes } from "@/content/demos";

const loop = [
  { step: "Learn", detail: "Plain-English lessons with every technical term defined." },
  { step: "Practise", detail: "Quizzes, role-play, objections, demos, call debriefs." },
  { step: "Get graded", detail: "A rubric score per skill, not a vague thumbs up." },
  { step: "Understand why", detail: "What was missing, and what it costs you in a real call." },
  { step: "Try again", detail: "Same scenario, better answer, higher score." },
  { step: "Track", detail: "Per-skill scores and your weakest areas over time." },
];

const practiceAreas = [
  {
    href: "/roleplay",
    title: "Role-play",
    detail: `${personas.length} buyers, from a skeptical CTO to procurement. They only reveal pain if you ask properly.`,
  },
  {
    href: "/objections",
    title: "Objections",
    detail: `${objections.length} real objections with an acknowledge → clarify → discover → evidence framework.`,
  },
  {
    href: "/demo-coach",
    title: "Demo coach",
    detail: `Describe a customer pain and get one of ${demoRecipes.length} demo recipes — plus what it does not prove.`,
  },
  {
    href: "/debrief",
    title: "Call debrief",
    detail: "Write up a call and find out which parts of MEDDICCC you actually covered.",
  },
];

export default function Home() {
  return (
    <div className="grid gap-10">
      <section className="grid gap-5">
        <span className="pill w-fit">For sellers without an engineering background</span>
        <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
          Learn to sell Devin to engineers who will test every word you say.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-[var(--muted)]">
          Software engineering in plain English, SPIN discovery, MEDDICCC
          qualification, and technical-buyer empathy — then graded practice
          against buyers who push back. Every technical term is defined the
          first time it appears, like this: a pull request (a proposed code
          change submitted for review).
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/learn" className="btn-primary">
            Start learning
          </Link>
          <Link href="/roleplay" className="btn-secondary">
            Try a skeptical CTO
          </Link>
        </div>
      </section>

      <NextStepCard />

      <section>
        <h2 className="text-xl font-semibold">The loop</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loop.map((item, index) => (
            <div key={item.step} className="card-muted">
              <p className="label">Step {index + 1}</p>
              <p className="mt-1 font-medium">{item.step}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold">Curriculum</h2>
          <p className="text-sm text-[var(--muted)]">
            {lessons.length} lessons · {quizzes.length} quizzes
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {modules.map((module) => (
            <Link
              key={module.id}
              href={`/learn#module-${module.id}`}
              className="card transition-colors hover:border-[var(--accent)]"
            >
              <p className="label">Module {module.id}</p>
              <p className="mt-1 font-medium">{module.title}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{module.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Practice</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {practiceAreas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="card transition-colors hover:border-[var(--accent)]"
            >
              <p className="font-medium">{area.title}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{area.detail}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
