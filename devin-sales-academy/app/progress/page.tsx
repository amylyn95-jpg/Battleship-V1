"use client";

import Link from "next/link";
import { ScoreBar } from "@/components/score";
import { lessons, quizzes } from "@/content";
import { skillSummaries, totalPractice } from "@/lib/progress";
import { useProgress } from "@/lib/use-progress";
import type { SkillId } from "@/lib/types";

const PRACTICE_FOR_SKILL: Record<SkillId, { href: string; label: string }> = {
  technicalFluency: {
    href: "/quiz/quiz-engineering-basics",
    label: "Engineering basics quiz",
  },
  empathy: { href: "/roleplay", label: "Role-play a technical buyer" },
  spin: { href: "/quiz/quiz-spin", label: "SPIN quiz" },
  meddiccc: { href: "/quiz/quiz-meddiccc", label: "MEDDICCC quiz" },
  objections: { href: "/objections", label: "Objection practice" },
  demos: { href: "/demo-coach", label: "Demo coach" },
};

const TREND_LABEL: Record<string, string> = {
  up: "improving",
  down: "slipped",
  flat: "flat",
  new: "first attempt",
};

export default function ProgressPage() {
  const { progress, loaded, reset } = useProgress();

  if (!loaded) {
    return <p className="text-sm text-[var(--muted)]">Loading your progress…</p>;
  }

  const summaries = skillSummaries(progress);
  const practised = summaries.filter((s) => s.score !== null);
  const weakest = [...practised].sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 2);
  const attempts = totalPractice(progress);
  const checksPassed = Object.values(progress.knowledgeChecks).filter(Boolean).length;

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <h1 className="text-3xl font-semibold">Progress</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Stored in this browser, so a refresh keeps it. Scores are the average
          of your last three attempts per skill.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <p className="label">Lessons read</p>
          <p className="mt-1 text-2xl font-semibold">
            {progress.lessonsRead.length}
            <span className="text-sm font-normal text-[var(--muted)]">
              {" "}
              / {lessons.length}
            </span>
          </p>
        </div>
        <div className="card">
          <p className="label">Knowledge checks passed</p>
          <p className="mt-1 text-2xl font-semibold">{checksPassed}</p>
        </div>
        <div className="card">
          <p className="label">Graded attempts</p>
          <p className="mt-1 text-2xl font-semibold">{attempts}</p>
        </div>
      </div>

      <section className="card">
        <p className="label">Skills</p>
        <div className="mt-4 grid gap-4">
          {summaries.map((summary) => (
            <div key={summary.skill}>
              {summary.score === null ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-[var(--muted)]">
                    {summary.label} — not practised yet
                  </span>
                  <Link
                    href={PRACTICE_FOR_SKILL[summary.skill].href}
                    className="text-xs text-[var(--accent)]"
                  >
                    {PRACTICE_FOR_SKILL[summary.skill].label} →
                  </Link>
                </div>
              ) : (
                <ScoreBar
                  percent={summary.score}
                  label={summary.label}
                  detail={`${summary.attempts} attempt${summary.attempts === 1 ? "" : "s"} · ${TREND_LABEL[summary.trend]}`}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {weakest.length > 0 && (
        <section className="card border-[var(--accent)]/40">
          <p className="label">Work on these next</p>
          <div className="mt-3 grid gap-3">
            {weakest.map((summary) => (
              <div
                key={summary.skill}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <p className="prose-body">
                  {summary.label} — {summary.score}%
                </p>
                <Link
                  href={PRACTICE_FOR_SKILL[summary.skill].href}
                  className="btn-secondary"
                >
                  {PRACTICE_FOR_SKILL[summary.skill].label}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <p className="label">Quiz history</p>
        {progress.quizAttempts.length === 0 ? (
          <p className="prose-body mt-2 text-[var(--muted)]">
            No quizzes yet.{" "}
            <Link href={`/quiz/${quizzes[0].id}`} className="text-[var(--accent)]">
              Start with {quizzes[0].title}
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {[...progress.quizAttempts]
              .reverse()
              .slice(0, 12)
              .map((attempt, index) => {
                const quiz = quizzes.find((q) => q.id === attempt.quizId);
                return (
                  <li
                    key={`${attempt.at}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2 text-sm last:border-0"
                  >
                    <span>{quiz?.title ?? attempt.quizId}</span>
                    <span className="text-[var(--muted)]">
                      {attempt.score}% ·{" "}
                      {new Date(attempt.at).toLocaleDateString()}
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      <section className="card">
        <p className="label">Practice history</p>
        <div className="mt-3 grid gap-1.5 text-sm text-[var(--muted)]">
          <p>Role-plays: {progress.roleplayAttempts.length}</p>
          <p>Objections: {progress.objectionAttempts.length}</p>
          <p>Demos built: {progress.demoAttempts.length}</p>
          <p>Call debriefs: {progress.debriefAttempts.length}</p>
        </div>
      </section>

      <div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            if (
              window.confirm(
                "Erase all progress stored in this browser? This cannot be undone.",
              )
            ) {
              reset();
            }
          }}
        >
          Reset my progress
        </button>
      </div>
    </div>
  );
}
