"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GradeCard, ScoreBar } from "@/components/score";
import {
  emptyAnswer,
  gradeQuiz,
  isAnswered,
  type Answer,
  type QuizResult,
} from "@/lib/quiz-grading";
import { useProgress } from "@/lib/use-progress";
import {
  MEDDICCC_LABELS,
  SKILL_LABELS,
  SPIN_LABELS,
  type MeddicccCategory,
  type Question,
  type Quiz,
  type SpinCategory,
} from "@/lib/types";

function QuestionCard({
  question,
  index,
  answer,
  onChange,
  disabled,
}: {
  question: Question;
  index: number;
  answer: Answer;
  onChange: (answer: Answer) => void;
  disabled: boolean;
}) {
  return (
    <div className="card grid gap-4">
      <div>
        <p className="label">Question {index + 1}</p>
        {question.customerSays && (
          <p className="prose-body mt-2 border-l-2 border-[var(--accent)] pl-3 italic text-[var(--muted)]">
            Customer: &ldquo;{question.customerSays}&rdquo;
          </p>
        )}
        <p className="prose-body mt-2 font-medium">{question.prompt}</p>
      </div>

      {(question.type === "multipleChoice" || question.type === "bestFollowUp") && (
        <div className="grid gap-2">
          {question.options.map((option, optionIndex) => (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ kind: "choice", index: optionIndex })}
              className={`rounded-lg border bg-[var(--surface-2)] p-3 text-left text-sm ${
                answer.kind === "choice" && answer.index === optionIndex
                  ? "border-[var(--accent)]"
                  : "border-[var(--border)]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {question.type === "selectAll" && (
        <div className="grid gap-2">
          <p className="text-xs text-[var(--muted)]">Select all that apply.</p>
          {question.options.map((option, optionIndex) => {
            const selected =
              answer.kind === "selectAll" && answer.indexes.includes(optionIndex);
            return (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() => {
                  const current = answer.kind === "selectAll" ? answer.indexes : [];
                  onChange({
                    kind: "selectAll",
                    indexes: selected
                      ? current.filter((i) => i !== optionIndex)
                      : [...current, optionIndex],
                  });
                }}
                className={`rounded-lg border bg-[var(--surface-2)] p-3 text-left text-sm ${
                  selected ? "border-[var(--accent)]" : "border-[var(--border)]"
                }`}
              >
                {selected ? "✓ " : ""}
                {option}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "rank" && (
        <div className="grid gap-2">
          <p className="text-xs text-[var(--muted)]">
            Order these from best to worst. Move at least one item so the
            ordering counts as your answer.
          </p>
          {(answer.kind === "rank" ? answer.order : []).map((optionIndex, position) => (
            <div
              key={optionIndex}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3"
            >
              <span className="text-xs text-[var(--muted)]">{position + 1}</span>
              <span className="flex-1 text-sm">{question.options[optionIndex]}</span>
              <button
                type="button"
                aria-label="Move up"
                disabled={disabled || position === 0}
                className="btn-secondary px-2 py-1"
                onClick={() => {
                  const order = [...(answer.kind === "rank" ? answer.order : [])];
                  [order[position - 1], order[position]] = [
                    order[position],
                    order[position - 1],
                  ];
                  onChange({ kind: "rank", order, touched: true });
                }}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={
                  disabled ||
                  position === (answer.kind === "rank" ? answer.order.length - 1 : 0)
                }
                className="btn-secondary px-2 py-1"
                onClick={() => {
                  const order = [...(answer.kind === "rank" ? answer.order : [])];
                  [order[position + 1], order[position]] = [
                    order[position],
                    order[position + 1],
                  ];
                  onChange({ kind: "rank", order, touched: true });
                }}
              >
                ↓
              </button>
            </div>
          ))}
        </div>
      )}

      {(question.type === "identifySpin" || question.type === "identifyMeddiccc") && (
        <div className="grid gap-3">
          <p className="prose-body border-l-2 border-[var(--accent)] pl-3 italic">
            &ldquo;{question.statement}&rdquo;
          </p>
          <div className="flex flex-wrap gap-2">
            {(question.type === "identifySpin"
              ? (Object.keys(SPIN_LABELS) as SpinCategory[]).map((key) => ({
                  key,
                  label: SPIN_LABELS[key],
                }))
              : (Object.keys(MEDDICCC_LABELS) as MeddicccCategory[]).map((key) => ({
                  key,
                  label: MEDDICCC_LABELS[key],
                }))
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ kind: "category", value: option.key })}
                className={`rounded-lg border bg-[var(--surface-2)] px-3 py-2 text-sm ${
                  answer.kind === "category" && answer.value === option.key
                    ? "border-[var(--accent)]"
                    : "border-[var(--border)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(question.type === "rewrite" ||
        question.type === "scenario" ||
        question.type === "shortAnswer") && (
        <div className="grid gap-2">
          <textarea
            className="field min-h-32"
            placeholder="Write what you would actually say."
            disabled={disabled}
            value={answer.kind === "text" ? answer.text : ""}
            onChange={(event) =>
              onChange({ kind: "text", text: event.target.value })
            }
          />
          <p className="text-xs text-[var(--muted)]">
            Graded on: {question.rubric.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const { recordQuizAttempt, progress } = useProgress();
  const [answers, setAnswers] = useState<Record<string, Answer>>(() =>
    Object.fromEntries(quiz.questions.map((q) => [q.id, emptyAnswer(q)])),
  );
  const [result, setResult] = useState<QuizResult | null>(null);

  const answeredCount = useMemo(
    () => quiz.questions.filter((q) => isAnswered(answers[q.id])).length,
    [answers, quiz.questions],
  );

  const previousBest = progress.quizAttempts
    .filter((a) => a.quizId === quiz.id)
    .reduce<number | null>((best, a) => (best === null ? a.score : Math.max(best, a.score)), null);

  function submit() {
    const graded = gradeQuiz(quiz.id, quiz.questions, answers);
    setResult(graded);
    recordQuizAttempt({
      quizId: quiz.id,
      score: graded.score,
      skillScores: graded.skillScores,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function retry() {
    setAnswers(
      Object.fromEntries(quiz.questions.map((q) => [q.id, emptyAnswer(q)])),
    );
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="pill">Module {quiz.module}</span>
          {quiz.skills.map((skill) => (
            <span key={skill} className="pill">
              {SKILL_LABELS[skill]}
            </span>
          ))}
          {previousBest !== null && (
            <span className="pill">Best so far: {previousBest}%</span>
          )}
        </div>
        <h1 className="text-3xl font-semibold">{quiz.title}</h1>
        <p className="max-w-2xl text-sm text-[var(--muted)]">{quiz.description}</p>
      </header>

      {result && (
        <section className="grid gap-5">
          <div className="card">
            <p className="label">Your score</p>
            <p className="mt-1 text-4xl font-semibold">{result.score}%</p>
            {previousBest !== null && (
              <p className="mt-2 text-sm text-[var(--muted)]">
                {result.score > previousBest
                  ? `Up from ${previousBest}% — that is the loop working.`
                  : result.score === previousBest
                    ? `Same as your best (${previousBest}%).`
                    : `Your best is still ${previousBest}%.`}
              </p>
            )}
            <div className="mt-5 grid gap-4">
              {Object.entries(result.skillScores).map(([skill, score]) => (
                <ScoreBar
                  key={skill}
                  percent={score ?? 0}
                  label={SKILL_LABELS[skill as keyof typeof SKILL_LABELS]}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={retry}>
              Try again
            </button>
            <Link href="/progress" className="btn-secondary">
              Track improvement
            </Link>
            <Link href="/learn" className="btn-secondary">
              Back to lessons
            </Link>
          </div>
        </section>
      )}

      <div className="grid gap-4">
        {quiz.questions.map((question, index) => {
          const questionResult = result?.results.find(
            (r) => r.questionId === question.id,
          );
          return (
            <div key={question.id} className="grid gap-3">
              <QuestionCard
                question={question}
                index={index}
                answer={answers[question.id]}
                disabled={result !== null}
                onChange={(answer) =>
                  setAnswers((current) => ({ ...current, [question.id]: answer }))
                }
              />
              {questionResult && (
                <div
                  className={`card-muted border ${
                    questionResult.correct
                      ? "border-emerald-400/50"
                      : "border-rose-400/50"
                  }`}
                >
                  <p className="text-sm font-medium">
                    {questionResult.correct
                      ? "Correct"
                      : questionResult.fraction > 0
                        ? `Partly right (${Math.round(questionResult.fraction * 100)}%)`
                        : "Incorrect"}
                  </p>
                  <p className="prose-body mt-2">{questionResult.explanation}</p>
                  {questionResult.grade && (
                    <div className="mt-4">
                      <GradeCard
                        grade={questionResult.grade}
                        title="Rubric breakdown"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!result && (
        <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 p-4 backdrop-blur">
          <button
            type="button"
            className="btn-primary"
            disabled={answeredCount === 0}
            onClick={submit}
          >
            Submit and get graded
          </button>
          <p className="text-xs text-[var(--muted)]">
            {answeredCount} of {quiz.questions.length} answered
          </p>
        </div>
      )}
    </div>
  );
}
