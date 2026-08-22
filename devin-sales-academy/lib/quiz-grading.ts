import { gradeResponse, type GradeResult } from "./grading";
import type { Question, SkillId } from "./types";

export type Answer =
  | { kind: "choice"; index: number | null }
  | { kind: "selectAll"; indexes: number[] }
  | { kind: "rank"; order: number[]; touched: boolean }
  | { kind: "category"; value: string | null }
  | { kind: "text"; text: string };

export interface QuestionResult {
  questionId: string;
  skills: SkillId[];
  /** 0-1 fraction of credit earned. */
  fraction: number;
  correct: boolean;
  explanation: string;
  /** Present for free-text questions. */
  grade?: GradeResult;
}

export function emptyAnswer(question: Question): Answer {
  switch (question.type) {
    case "multipleChoice":
    case "bestFollowUp":
      return { kind: "choice", index: null };
    case "selectAll":
      return { kind: "selectAll", indexes: [] };
    case "rank":
      return {
        kind: "rank",
        order: question.options.map((_, i) => i),
        touched: false,
      };
    case "identifySpin":
    case "identifyMeddiccc":
      return { kind: "category", value: null };
    default:
      return { kind: "text", text: "" };
  }
}

export function isAnswered(answer: Answer): boolean {
  switch (answer.kind) {
    case "choice":
      return answer.index !== null;
    case "selectAll":
      return answer.indexes.length > 0;
    case "rank":
      return answer.touched;
    case "category":
      return answer.value !== null;
    case "text":
      return answer.text.trim().length > 0;
  }
}

/** Fraction of adjacent pairs that are in the correct relative order. */
function rankFraction(order: number[], correctOrder: number[]): number {
  let correctPairs = 0;
  let totalPairs = 0;
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      totalPairs++;
      if (
        correctOrder.indexOf(order[i]) < correctOrder.indexOf(order[j])
      ) {
        correctPairs++;
      }
    }
  }
  return totalPairs === 0 ? 0 : correctPairs / totalPairs;
}

export function gradeQuestion(question: Question, answer: Answer): QuestionResult {
  const base = { questionId: question.id, skills: question.skills };

  switch (question.type) {
    case "multipleChoice":
    case "bestFollowUp": {
      const index = answer.kind === "choice" ? answer.index : null;
      const correct = index === question.answerIndex;
      return {
        ...base,
        fraction: correct ? 1 : 0,
        correct,
        explanation: question.explanation,
      };
    }
    case "selectAll": {
      const chosen = answer.kind === "selectAll" ? answer.indexes : [];
      const right = chosen.filter((i) => question.answerIndexes.includes(i)).length;
      const wrong = chosen.length - right;
      const fraction = Math.max(
        0,
        (right - wrong) / question.answerIndexes.length,
      );
      return {
        ...base,
        fraction,
        correct: fraction === 1,
        explanation: question.explanation,
      };
    }
    case "rank": {
      const touched = answer.kind === "rank" && answer.touched;
      const order = answer.kind === "rank" ? answer.order : [];
      const fraction = touched ? rankFraction(order, question.correctOrder) : 0;
      return {
        ...base,
        fraction,
        correct: fraction === 1,
        explanation: question.explanation,
      };
    }
    case "identifySpin":
    case "identifyMeddiccc": {
      const value = answer.kind === "category" ? answer.value : null;
      const correct = value === question.answer;
      return {
        ...base,
        fraction: correct ? 1 : 0,
        correct,
        explanation: question.explanation,
      };
    }
    default: {
      const text = answer.kind === "text" ? answer.text : "";
      const grade = gradeResponse({
        answer: text,
        rubric: question.rubric,
        contextKeywords: question.contextKeywords,
        modelAnswer: question.modelAnswer,
        nextBestQuestion: question.nextBestQuestion,
      });
      const fraction = Math.min(1, grade.overall / 4);
      return {
        ...base,
        fraction,
        correct: grade.overall >= 3.5,
        explanation: `Scored ${grade.overall.toFixed(1)} / 5 against the rubric.`,
        grade,
      };
    }
  }
}

export interface QuizResult {
  quizId: string;
  /** 0-100. */
  score: number;
  results: QuestionResult[];
  /** Score per skill, 0-100. */
  skillScores: Partial<Record<SkillId, number>>;
}

export function gradeQuiz(
  quizId: string,
  questions: Question[],
  answers: Record<string, Answer>,
): QuizResult {
  const results = questions.map((q) =>
    gradeQuestion(q, answers[q.id] ?? emptyAnswer(q)),
  );
  const score =
    results.length === 0
      ? 0
      : Math.round(
          (results.reduce((sum, r) => sum + r.fraction, 0) / results.length) * 100,
        );

  const totals = new Map<SkillId, { sum: number; count: number }>();
  for (const r of results) {
    for (const skill of r.skills) {
      const entry = totals.get(skill) ?? { sum: 0, count: 0 };
      entry.sum += r.fraction;
      entry.count += 1;
      totals.set(skill, entry);
    }
  }
  const skillScores: Partial<Record<SkillId, number>> = {};
  for (const [skill, { sum, count }] of totals) {
    skillScores[skill] = Math.round((sum / count) * 100);
  }

  return { quizId, score, results, skillScores };
}
