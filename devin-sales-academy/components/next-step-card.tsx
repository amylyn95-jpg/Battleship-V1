"use client";

import Link from "next/link";
import { lessons } from "@/content";
import { totalPractice, weakestSkills } from "@/lib/progress";
import { useProgress } from "@/lib/use-progress";
import type { SkillId } from "@/lib/types";

const PRACTICE_FOR_SKILL: Record<SkillId, { href: string; label: string }> = {
  technicalFluency: { href: "/quiz/quiz-engineering-basics", label: "Engineering basics quiz" },
  empathy: { href: "/roleplay", label: "Role-play a skeptical CTO" },
  spin: { href: "/quiz/quiz-spin", label: "SPIN discovery quiz" },
  meddiccc: { href: "/quiz/quiz-meddiccc", label: "MEDDICCC quiz" },
  objections: { href: "/objections", label: "Objection practice" },
  demos: { href: "/demo-coach", label: "Build a demo from a pain" },
};

export function NextStepCard() {
  const { progress, loaded } = useProgress();

  if (!loaded) {
    return (
      <div className="card">
        <p className="label">Your next step</p>
        <p className="prose-body mt-2 text-[var(--muted)]">Loading progress…</p>
      </div>
    );
  }

  const practiced = totalPractice(progress);
  const unreadLesson = lessons.find((l) => !progress.lessonsRead.includes(l.id));
  const weakest = weakestSkills(progress, 1)[0];

  return (
    <div className="card">
      <p className="label">Your next step</p>
      {practiced === 0 ? (
        <>
          <p className="prose-body mt-2">
            Start at the beginning: one lesson, then one quiz. The loop is
            learn, practise, get graded, try again.
          </p>
          <Link href="/learn" className="btn-primary mt-4">
            Start the first lesson
          </Link>
        </>
      ) : (
        <>
          <p className="prose-body mt-2">
            {practiced} graded attempt{practiced === 1 ? "" : "s"} so far.
            {weakest && weakest.score !== null
              ? ` Your weakest area is ${weakest.label.toLowerCase()} at ${weakest.score}%.`
              : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {weakest && (
              <Link
                href={PRACTICE_FOR_SKILL[weakest.skill].href}
                className="btn-primary"
              >
                {PRACTICE_FOR_SKILL[weakest.skill].label}
              </Link>
            )}
            {unreadLesson && (
              <Link href={`/lesson/${unreadLesson.id}`} className="btn-secondary">
                Next lesson: {unreadLesson.title}
              </Link>
            )}
            <Link href="/progress" className="btn-secondary">
              See progress
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
