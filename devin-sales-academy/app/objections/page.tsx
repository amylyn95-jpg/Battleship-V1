"use client";

import { useState } from "react";
import { GradeCard, RubricLegend } from "@/components/score";
import { objections } from "@/content";
import { gradeResponse, type GradeResult } from "@/lib/grading";
import { useProgress } from "@/lib/use-progress";
import type { Objection, RubricCategory } from "@/lib/types";

const RUBRIC: RubricCategory[] = [
  "empathy",
  "technicalAccuracy",
  "relevance",
  "persuasion",
  "nextStep",
];

export default function ObjectionsPage() {
  const { recordPractice, progress } = useProgress();
  const [active, setActive] = useState<Objection>(objections[0]);
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<GradeResult | null>(null);

  function select(objection: Objection) {
    setActive(objection);
    setAnswer("");
    setGrade(null);
  }

  function submit() {
    const result = gradeResponse({
      answer,
      rubric: RUBRIC,
      contextKeywords: active.contextKeywords,
      modelAnswer: `${active.acknowledge} ${active.clarify} ${active.discoveryQuestion}`,
      nextBestQuestion: active.discoveryQuestion,
      whyItMatters: active.whyTheyAskIt,
    });
    setGrade(result);
    recordPractice("objectionAttempts", {
      refId: active.id,
      overall: result.overall,
      skills: ["objections", "empathy"],
    });
  }

  const attempts = progress.objectionAttempts.filter((a) => a.refId === active.id);

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <h1 className="text-3xl font-semibold">Objection practice</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Answer in your own words first, get graded, then compare against the
          framework: acknowledge, clarify, ask, then offer evidence or a bounded
          next step. Never argue.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {objections.map((objection) => (
          <button
            key={objection.id}
            type="button"
            onClick={() => select(objection)}
            className={`rounded-lg border px-3 py-2 text-left text-xs ${
              active.id === objection.id
                ? "border-[var(--accent)] bg-[var(--surface-2)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
            }`}
          >
            {objection.objection.length > 60
              ? `${objection.objection.slice(0, 57)}…`
              : objection.objection}
          </button>
        ))}
      </div>

      <div className="card">
        <p className="label">The customer says</p>
        <p className="prose-body mt-2 text-base italic">
          &ldquo;{active.objection}&rdquo;
        </p>
        {attempts.length > 0 && (
          <p className="mt-3 text-xs text-[var(--muted)]">
            {attempts.length} previous attempt
            {attempts.length === 1 ? "" : "s"} · best{" "}
            {Math.max(...attempts.map((a) => a.overall)).toFixed(1)} / 5
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-3">
          <textarea
            className="field min-h-40"
            placeholder="What do you actually say?"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={grade !== null}
          />
          {grade === null ? (
            <button
              type="button"
              className="btn-primary w-fit"
              disabled={answer.trim().length === 0}
              onClick={submit}
            >
              Grade my response
            </button>
          ) : (
            <button
              type="button"
              className="btn-secondary w-fit"
              onClick={() => {
                setGrade(null);
                setAnswer("");
              }}
            >
              Try again
            </button>
          )}
        </div>
        <RubricLegend categories={RUBRIC} />
      </div>

      {grade && (
        <>
          <GradeCard grade={grade} title="Objection grading" />

          <div className="card">
            <p className="label">Why they really ask this</p>
            <p className="prose-body mt-2">{active.whyTheyAskIt}</p>

            <div className="mt-5 grid gap-4">
              <div>
                <p className="label">1. Acknowledge</p>
                <p className="prose-body mt-1 italic">&ldquo;{active.acknowledge}&rdquo;</p>
              </div>
              <div>
                <p className="label">2. Clarify</p>
                <p className="prose-body mt-1 italic">&ldquo;{active.clarify}&rdquo;</p>
              </div>
              <div>
                <p className="label">3. Ask</p>
                <p className="prose-body mt-1 italic">
                  &ldquo;{active.discoveryQuestion}&rdquo;
                </p>
              </div>
              <div>
                <p className="label">4. Relevant Devin workflow</p>
                <p className="prose-body mt-1">{active.devinWorkflow}</p>
              </div>
              <div>
                <p className="label">5. Evidence or bounded next step</p>
                <p className="prose-body mt-1">{active.evidenceOrNextStep}</p>
              </div>
            </div>
          </div>

          <div className="card border-rose-500/40">
            <p className="label text-rose-300">Do not say</p>
            <ul className="mt-2 grid list-disc gap-1.5 pl-4">
              {active.avoid.map((item) => (
                <li key={item} className="prose-body">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
