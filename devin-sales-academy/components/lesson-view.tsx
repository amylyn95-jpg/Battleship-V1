"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProgress } from "@/lib/use-progress";
import { SKILL_LABELS, type Lesson } from "@/lib/types";

interface Props {
  lesson: Lesson;
  next?: { id: string; title: string };
  quizHref?: string;
}

const sections = [
  { key: "definition", label: "In plain English" },
  { key: "example", label: "Example" },
  { key: "whyCtoCares", label: "Why a CTO cares" },
  { key: "businessImpact", label: "Business impact" },
  { key: "devinConnection", label: "How it connects to Devin" },
  { key: "misconception", label: "Common misconception" },
] as const;

export function LessonView({ lesson, next, quizHref }: Props) {
  const { markLessonRead, recordKnowledgeCheck, progress } = useProgress();
  const [choice, setChoice] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    markLessonRead(lesson.id);
  }, [lesson.id, markLessonRead]);

  const correct = choice === lesson.knowledgeCheck.answerIndex;
  const previous = progress.knowledgeChecks[lesson.id];

  return (
    <article className="grid gap-8">
      <header className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">Module {lesson.module}</span>
          {lesson.skills.map((skill) => (
            <span key={skill} className="pill">
              {SKILL_LABELS[skill]}
            </span>
          ))}
          {previous !== undefined && (
            <span className="pill">
              Knowledge check: {previous ? "passed" : "not yet"}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-semibold">{lesson.title}</h1>
      </header>

      <div className="grid gap-4">
        {sections.map((section) => (
          <div key={section.key} className="card">
            <p className="label">{section.label}</p>
            <p className="prose-body mt-2">{lesson[section.key]}</p>
          </div>
        ))}
      </div>

      <div className="card border-[var(--accent)]/40">
        <p className="label">Ask a customer this</p>
        <p className="prose-body mt-2 italic">
          &ldquo;{lesson.customerQuestion}&rdquo;
        </p>
        <p className="label mt-4">What that sets up</p>
        <p className="prose-body mt-2">{lesson.questionImplication}</p>
      </div>

      <section className="card">
        <p className="label">Knowledge check</p>
        <p className="prose-body mt-2 font-medium">
          {lesson.knowledgeCheck.question}
        </p>
        <div className="mt-4 grid gap-2">
          {lesson.knowledgeCheck.options.map((option, index) => {
            const isChosen = choice === index;
            const isAnswer = index === lesson.knowledgeCheck.answerIndex;
            const tone = !submitted
              ? isChosen
                ? "border-[var(--accent)]"
                : "border-[var(--border)]"
              : isAnswer
                ? "border-emerald-400/70"
                : isChosen
                  ? "border-rose-400/70"
                  : "border-[var(--border)]";
            return (
              <button
                key={option}
                type="button"
                disabled={submitted}
                onClick={() => setChoice(index)}
                className={`rounded-lg border bg-[var(--surface-2)] p-3 text-left text-sm transition-colors ${tone}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {!submitted ? (
          <button
            type="button"
            className="btn-primary mt-4"
            disabled={choice === null}
            onClick={() => {
              setSubmitted(true);
              recordKnowledgeCheck(lesson.id, choice === lesson.knowledgeCheck.answerIndex);
            }}
          >
            Check my answer
          </button>
        ) : (
          <div className="mt-4 grid gap-3">
            <p className="text-sm font-medium">
              {correct ? "Correct." : "Not quite."}
            </p>
            <p className="prose-body">{lesson.knowledgeCheck.explanation}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSubmitted(false);
                  setChoice(null);
                }}
              >
                Try again
              </button>
              {quizHref && (
                <Link href={quizHref} className="btn-secondary">
                  Practise this module
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      <nav className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/learn" className="btn-secondary">
          All lessons
        </Link>
        {next && (
          <Link href={`/lesson/${next.id}`} className="btn-primary">
            Next: {next.title}
          </Link>
        )}
      </nav>
    </article>
  );
}
