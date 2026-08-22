"use client";

import Link from "next/link";
import { lessons, modules, quizzes } from "@/content";
import { useProgress } from "@/lib/use-progress";

export default function LearnPage() {
  const { progress } = useProgress();

  return (
    <div className="grid gap-10">
      <header className="grid gap-3">
        <h1 className="text-3xl font-semibold">Learn</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Five modules. Each lesson gives you a plain-English definition, why a
          CTO (chief technology officer — the person accountable for the
          engineering organisation) cares, how it connects to Devin, and a
          question you can ask a customer tomorrow.
        </p>
      </header>

      {modules.map((module) => {
        const moduleLessons = lessons.filter((l) => l.module === module.id);
        const moduleQuizzes = quizzes.filter((q) => q.module === module.id);
        const read = moduleLessons.filter((l) =>
          progress.lessonsRead.includes(l.id),
        ).length;

        return (
          <section key={module.id} id={`module-${module.id}`} className="grid gap-4 scroll-mt-20">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="label">Module {module.id}</p>
                <h2 className="mt-1 text-xl font-semibold">{module.title}</h2>
              </div>
              <p className="text-xs text-[var(--muted)]">
                {read} / {moduleLessons.length} lessons read
              </p>
            </div>
            <p className="max-w-2xl text-sm text-[var(--muted)]">{module.summary}</p>

            <ul className="grid gap-2 sm:grid-cols-2">
              {moduleLessons.map((lesson) => {
                const isRead = progress.lessonsRead.includes(lesson.id);
                const check = progress.knowledgeChecks[lesson.id];
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/lesson/${lesson.id}`}
                      className="card flex h-full items-start justify-between gap-3 transition-colors hover:border-[var(--accent)]"
                    >
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                          {lesson.definition}
                        </p>
                      </div>
                      <span className="pill shrink-0">
                        {check === true
                          ? "Passed"
                          : check === false
                            ? "Retry"
                            : isRead
                              ? "Read"
                              : "New"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {moduleQuizzes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {moduleQuizzes.map((quiz) => {
                  const attempts = progress.quizAttempts.filter(
                    (a) => a.quizId === quiz.id,
                  );
                  const best = attempts.length
                    ? Math.max(...attempts.map((a) => a.score))
                    : null;
                  return (
                    <Link
                      key={quiz.id}
                      href={`/quiz/${quiz.id}`}
                      className="btn-secondary"
                    >
                      {quiz.title}
                      {best !== null ? ` · best ${best}%` : ""}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
