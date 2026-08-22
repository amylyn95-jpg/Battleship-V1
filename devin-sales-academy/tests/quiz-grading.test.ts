import { describe, expect, it } from "vitest";
import { lessons, quizzes } from "@/content";
import { emptyAnswer, gradeQuestion, gradeQuiz } from "@/lib/quiz-grading";
import type { Question } from "@/lib/types";

function findQuestion(predicate: (q: Question) => boolean): Question {
  const question = quizzes.flatMap((q) => q.questions).find(predicate);
  if (!question) throw new Error("No question of that type in the seeded content");
  return question;
}

describe("content integrity", () => {
  it("has unique lesson and quiz ids", () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
    expect(new Set(quizzes.map((q) => q.id)).size).toBe(quizzes.length);
  });

  it("has an in-range answer for every lesson knowledge check", () => {
    for (const lesson of lessons) {
      const { options, answerIndex } = lesson.knowledgeCheck;
      expect(answerIndex).toBeGreaterThanOrEqual(0);
      expect(answerIndex).toBeLessThan(options.length);
    }
  });

  it("has valid answers for every objective quiz question", () => {
    for (const quiz of quizzes) {
      for (const question of quiz.questions) {
        if (question.type === "multipleChoice" || question.type === "bestFollowUp") {
          expect(question.answerIndex).toBeLessThan(question.options.length);
        }
        if (question.type === "selectAll") {
          expect(question.answerIndexes.length).toBeGreaterThan(0);
          for (const index of question.answerIndexes) {
            expect(index).toBeLessThan(question.options.length);
          }
        }
        if (question.type === "rank") {
          expect([...question.correctOrder].sort()).toEqual(
            question.options.map((_, i) => i),
          );
        }
      }
    }
  });
});

describe("gradeQuestion", () => {
  it("awards full credit for the right multiple-choice answer", () => {
    const question = findQuestion((q) => q.type === "multipleChoice");
    if (question.type !== "multipleChoice") throw new Error("unexpected type");
    const result = gradeQuestion(question, {
      kind: "choice",
      index: question.answerIndex,
    });
    expect(result.fraction).toBe(1);
    expect(result.correct).toBe(true);
  });

  it("gives no credit for an unanswered question", () => {
    const question = findQuestion((q) => q.type === "multipleChoice");
    expect(gradeQuestion(question, emptyAnswer(question)).fraction).toBe(0);
  });

  it("gives partial credit on select-all and never goes negative", () => {
    const question = findQuestion((q) => q.type === "selectAll");
    if (question.type !== "selectAll") throw new Error("unexpected type");
    const wrongIndex = question.options.findIndex(
      (_, i) => !question.answerIndexes.includes(i),
    );
    const partial = gradeQuestion(question, {
      kind: "selectAll",
      indexes: [question.answerIndexes[0]],
    });
    expect(partial.fraction).toBeGreaterThan(0);
    expect(partial.fraction).toBeLessThan(1);

    if (wrongIndex >= 0) {
      const allWrong = gradeQuestion(question, {
        kind: "selectAll",
        indexes: [wrongIndex],
      });
      expect(allWrong.fraction).toBe(0);
    }
  });

  it("attaches a rubric grade to free-text questions", () => {
    const question = findQuestion((q) =>
      ["rewrite", "scenario", "shortAnswer"].includes(q.type),
    );
    const result = gradeQuestion(question, {
      kind: "text",
      text: "That makes sense. How does that work today, and what has it cost you this quarter? If we fixed it, what would that be worth?",
    });
    expect(result.grade).toBeDefined();
    expect(result.fraction).toBeGreaterThan(0);
  });
});

describe("gradeQuiz", () => {
  it("scores a fully correct objective quiz at 100%", () => {
    const quiz = quizzes.find((q) =>
      q.questions.every(
        (question) =>
          question.type === "multipleChoice" ||
          question.type === "bestFollowUp" ||
          question.type === "identifySpin" ||
          question.type === "identifyMeddiccc",
      ),
    );
    if (!quiz) return;

    const answers = Object.fromEntries(
      quiz.questions.map((question) => [
        question.id,
        question.type === "identifySpin" || question.type === "identifyMeddiccc"
          ? { kind: "category" as const, value: question.answer }
          : { kind: "choice" as const, index: (question as { answerIndex: number }).answerIndex },
      ]),
    );
    expect(gradeQuiz(quiz.id, quiz.questions, answers).score).toBe(100);
  });

  it("scores an empty submission at 0% and reports every skill", () => {
    const quiz = quizzes[0];
    const result = gradeQuiz(quiz.id, quiz.questions, {});
    expect(result.score).toBe(0);
    for (const skill of quiz.skills) {
      expect(result.skillScores[skill]).toBeDefined();
    }
  });
});
