"use client";

import Link from "next/link";
import { useState } from "react";
import { ScoreBar } from "@/components/score";
import { DEBRIEF_FIELDS, gradeDebrief, type DebriefReport } from "@/lib/debrief";
import { useProgress } from "@/lib/use-progress";
import { MEDDICCC_LABELS, SPIN_LABELS } from "@/lib/types";

export default function DebriefPage() {
  const { recordPractice, progress } = useProgress();
  const [values, setValues] = useState<Record<string, string>>({});
  const [report, setReport] = useState<DebriefReport | null>(null);

  function submit() {
    const result = gradeDebrief(values);
    setReport(result);
    recordPractice("debriefAttempts", {
      refId: `debrief-${Date.now()}`,
      overall: (result.score / 100) * 5,
      skills: ["meddiccc", "spin"],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const previous = progress.debriefAttempts;

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <h1 className="text-3xl font-semibold">Call debrief</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Write up a real call. Blank and hedged answers are the point — they
          show you exactly which questions you did not ask. Numbers and dates
          score highest because they are what make a forecast defensible.
        </p>
        {previous.length > 0 && (
          <p className="text-xs text-[var(--muted)]">
            {previous.length} previous debrief
            {previous.length === 1 ? "" : "s"} · best{" "}
            {Math.round(Math.max(...previous.map((a) => a.overall)) * 20)}%
          </p>
        )}
      </header>

      {report && (
        <section className="grid gap-5">
          <div className="card">
            <p className="label">Qualification completeness</p>
            <p className="mt-1 text-4xl font-semibold">{report.score}%</p>
            <div className="mt-5 grid gap-2">
              <div className="flex flex-wrap gap-2">
                {report.meddicccCovered.map((category) => (
                  <span key={category} className="pill border-emerald-400/50">
                    {MEDDICCC_LABELS[category]} ✓
                  </span>
                ))}
                {report.meddicccGaps.map((category) => (
                  <span key={category} className="pill border-rose-400/50">
                    {MEDDICCC_LABELS[category]} — gap
                  </span>
                ))}
              </div>
              {report.spinGaps.length > 0 && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  SPIN gaps:{" "}
                  {report.spinGaps.map((gap) => SPIN_LABELS[gap]).join(", ")}
                </p>
              )}
            </div>
          </div>

          {report.risks.length > 0 && (
            <div className="card border-rose-500/40">
              <p className="label text-rose-300">Deal risks</p>
              <ul className="mt-2 grid list-disc gap-2 pl-4">
                {report.risks.map((risk) => (
                  <li key={risk} className="prose-body">
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <p className="label">Do this next</p>
            <ul className="mt-2 grid list-disc gap-2 pl-4">
              {report.nextActions.map((action) => (
                <li key={action} className="prose-body">
                  {action}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <p className="label">Field by field</p>
            <div className="mt-4 grid gap-4">
              {report.assessments.map((assessment) => (
                <ScoreBar
                  key={assessment.field.id}
                  percent={(assessment.quality / 3) * 100}
                  label={assessment.field.label}
                  detail={assessment.note}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setReport(null)}
            >
              Edit and re-grade
            </button>
            <Link href="/progress" className="btn-secondary">
              Track improvement
            </Link>
          </div>
        </section>
      )}

      {!report && (
        <>
          <div className="grid gap-4">
            {DEBRIEF_FIELDS.map((field) => (
              <div key={field.id} className="card grid gap-2">
                <label htmlFor={field.id} className="font-medium">
                  {field.label}
                </label>
                <p className="text-xs text-[var(--muted)]">{field.hint}</p>
                <textarea
                  id={field.id}
                  className="field min-h-24"
                  placeholder={field.placeholder}
                  value={values[field.id] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.id]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 p-4 backdrop-blur">
            <button type="button" className="btn-primary" onClick={submit}>
              Grade my debrief
            </button>
            <p className="text-xs text-[var(--muted)]">
              Leave a field blank if you did not ask — it will be reported as a gap.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
