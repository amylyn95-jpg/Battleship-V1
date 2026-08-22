import { SKILL_LABELS, type SkillId } from "./types";

export const STORAGE_KEY = "devin-sales-academy.progress.v1";

export interface QuizAttempt {
  quizId: string;
  score: number;
  at: string;
  skillScores: Partial<Record<SkillId, number>>;
}

export interface PracticeAttempt {
  /** Persona, objection, demo, or debrief identifier. */
  refId: string;
  /** 0-5 rubric average. */
  overall: number;
  at: string;
  skills: SkillId[];
}

export interface Progress {
  version: 1;
  lessonsRead: string[];
  knowledgeChecks: Record<string, boolean>;
  quizAttempts: QuizAttempt[];
  roleplayAttempts: PracticeAttempt[];
  objectionAttempts: PracticeAttempt[];
  demoAttempts: PracticeAttempt[];
  debriefAttempts: PracticeAttempt[];
}

export const emptyProgress: Progress = {
  version: 1,
  lessonsRead: [],
  knowledgeChecks: {},
  quizAttempts: [],
  roleplayAttempts: [],
  objectionAttempts: [],
  demoAttempts: [],
  debriefAttempts: [],
};

function isProgress(value: unknown): value is Progress {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<Progress>;
  return v.version === 1 && Array.isArray(v.lessonsRead);
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return emptyProgress;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress;
    const parsed: unknown = JSON.parse(raw);
    if (!isProgress(parsed)) return emptyProgress;
    return { ...emptyProgress, ...parsed };
  } catch {
    return emptyProgress;
  }
}

export function saveProgress(progress: Progress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable (private mode or quota) — progress simply is not kept.
  }
}

export interface SkillSummary {
  skill: SkillId;
  label: string;
  /** 0-100, or null when never practised. */
  score: number | null;
  attempts: number;
  trend: "up" | "down" | "flat" | "new";
}

function attemptsToSkillPercents(
  attempts: PracticeAttempt[],
): { skill: SkillId; percent: number }[] {
  return attempts.flatMap((a) =>
    a.skills.map((skill) => ({ skill, percent: (a.overall / 5) * 100 })),
  );
}

export function skillSummaries(progress: Progress): SkillSummary[] {
  const byskill = new Map<SkillId, number[]>();
  const push = (skill: SkillId, percent: number) => {
    const list = byskill.get(skill) ?? [];
    list.push(percent);
    byskill.set(skill, list);
  };

  for (const attempt of progress.quizAttempts) {
    for (const [skill, percent] of Object.entries(attempt.skillScores)) {
      if (typeof percent === "number") push(skill as SkillId, percent);
    }
  }
  for (const list of [
    progress.roleplayAttempts,
    progress.objectionAttempts,
    progress.demoAttempts,
    progress.debriefAttempts,
  ]) {
    for (const { skill, percent } of attemptsToSkillPercents(list)) {
      push(skill, percent);
    }
  }

  return (Object.keys(SKILL_LABELS) as SkillId[]).map((skill) => {
    const list = byskill.get(skill) ?? [];
    if (list.length === 0) {
      return {
        skill,
        label: SKILL_LABELS[skill],
        score: null,
        attempts: 0,
        trend: "new" as const,
      };
    }
    const recent = list.slice(-3);
    const score = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
    let trend: SkillSummary["trend"] = "flat";
    if (list.length >= 2) {
      const last = list[list.length - 1];
      const previous = list[list.length - 2];
      if (last - previous >= 5) trend = "up";
      else if (previous - last >= 5) trend = "down";
    } else {
      trend = "new";
    }
    return { skill, label: SKILL_LABELS[skill], score, attempts: list.length, trend };
  });
}

export function weakestSkills(progress: Progress, count = 2): SkillSummary[] {
  return skillSummaries(progress)
    .filter((s) => s.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, count);
}

export function totalPractice(progress: Progress): number {
  return (
    progress.quizAttempts.length +
    progress.roleplayAttempts.length +
    progress.objectionAttempts.length +
    progress.demoAttempts.length +
    progress.debriefAttempts.length
  );
}
