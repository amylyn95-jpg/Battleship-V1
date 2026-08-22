"use client";

import { useCallback, useEffect, useState } from "react";
import {
  emptyProgress,
  loadProgress,
  saveProgress,
  type PracticeAttempt,
  type Progress,
  type QuizAttempt,
} from "./progress";
import type { SkillId } from "./types";

type PracticeKey =
  | "roleplayAttempts"
  | "objectionAttempts"
  | "demoAttempts"
  | "debriefAttempts";

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setLoaded(true);
  }, []);

  const update = useCallback((mutate: (current: Progress) => Progress) => {
    setProgress((current) => {
      const next = mutate(current);
      saveProgress(next);
      return next;
    });
  }, []);

  const markLessonRead = useCallback(
    (lessonId: string) =>
      update((p) =>
        p.lessonsRead.includes(lessonId)
          ? p
          : { ...p, lessonsRead: [...p.lessonsRead, lessonId] },
      ),
    [update],
  );

  const recordKnowledgeCheck = useCallback(
    (lessonId: string, correct: boolean) =>
      update((p) => ({
        ...p,
        knowledgeChecks: { ...p.knowledgeChecks, [lessonId]: correct },
      })),
    [update],
  );

  const recordQuizAttempt = useCallback(
    (attempt: Omit<QuizAttempt, "at">) =>
      update((p) => ({
        ...p,
        quizAttempts: [
          ...p.quizAttempts,
          { ...attempt, at: new Date().toISOString() },
        ],
      })),
    [update],
  );

  const recordPractice = useCallback(
    (
      key: PracticeKey,
      attempt: { refId: string; overall: number; skills: SkillId[] },
    ) =>
      update((p) => ({
        ...p,
        [key]: [
          ...p[key],
          { ...attempt, at: new Date().toISOString() } satisfies PracticeAttempt,
        ],
      })),
    [update],
  );

  const reset = useCallback(() => update(() => emptyProgress), [update]);

  return {
    progress,
    loaded,
    markLessonRead,
    recordKnowledgeCheck,
    recordQuizAttempt,
    recordPractice,
    reset,
  };
}
