import type { CategoryScore, GradeResult } from "@/lib/grading";
import { RUBRIC_DESCRIPTIONS, RUBRIC_LABELS } from "@/lib/types";

function toneFor(percent: number): string {
  if (percent >= 75) return "bg-emerald-400";
  if (percent >= 45) return "bg-amber-400";
  return "bg-rose-400";
}

export function ScoreBar({
  percent,
  label,
  detail,
}: {
  percent: number;
  label: string;
  detail?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-[var(--foreground)]">{label}</span>
        <span className="text-xs text-[var(--muted)]">{Math.round(clamped)}%</span>
      </div>
      <div
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full ${toneFor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {detail && <p className="mt-1.5 text-xs text-[var(--muted)]">{detail}</p>}
    </div>
  );
}

export function RubricRow({ score }: { score: CategoryScore }) {
  return (
    <ScoreBar
      percent={(score.score / 5) * 100}
      label={`${RUBRIC_LABELS[score.category]} — ${score.score}/5`}
      detail={score.note}
    />
  );
}

export function GradeCard({
  grade,
  title = "Grading",
}: {
  grade: GradeResult;
  title?: string;
}) {
  return (
    <div className="grid gap-5">
      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label">{title}</p>
            <p className="mt-1 text-3xl font-semibold">
              {grade.overall.toFixed(1)}
              <span className="text-base font-normal text-[var(--muted)]"> / 5</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {grade.spinLabels.map((label) => (
              <span key={label} className="pill">
                SPIN: {label}
              </span>
            ))}
            {grade.meddicccLabels.map((label) => (
              <span key={label} className="pill">
                MEDDICCC: {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {grade.scores.map((score) => (
            <RubricRow key={score.category} score={score} />
          ))}
        </div>
      </div>

      {grade.unsupportedClaims.length > 0 && (
        <div className="card border-rose-500/40">
          <p className="label text-rose-300">Claims you cannot defend</p>
          <ul className="mt-2 grid gap-2">
            {grade.unsupportedClaims.map((claim) => (
              <li key={claim} className="prose-body">
                {claim}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="label">What worked</p>
          <ul className="mt-2 grid list-disc gap-2 pl-4">
            {grade.strengths.map((item) => (
              <li key={item} className="prose-body">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <p className="label">What was missing</p>
          <ul className="mt-2 grid list-disc gap-2 pl-4">
            {grade.missing.map((item) => (
              <li key={item} className="prose-body">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <p className="label">Why this matters</p>
        <p className="prose-body mt-2">{grade.whyItMatters}</p>
      </div>

      <div className="card">
        <p className="label">A stronger version</p>
        <p className="prose-body mt-2 italic">&ldquo;{grade.strongerExample}&rdquo;</p>
        <p className="label mt-4">Your next best question</p>
        <p className="prose-body mt-2">{grade.nextBestQuestion}</p>
      </div>
    </div>
  );
}

export function RubricLegend({
  categories,
}: {
  categories: (keyof typeof RUBRIC_LABELS)[];
}) {
  return (
    <div className="card-muted">
      <p className="label">Graded on</p>
      <ul className="mt-2 grid gap-1.5">
        {categories.map((category) => (
          <li key={category} className="text-xs text-[var(--muted)]">
            <span className="text-[var(--foreground)]">
              {RUBRIC_LABELS[category]}
            </span>{" "}
            — {RUBRIC_DESCRIPTIONS[category]}
          </li>
        ))}
      </ul>
    </div>
  );
}
