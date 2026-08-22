import { describe, expect, it } from "vitest";
import { analyzeText, gradeResponse } from "@/lib/grading";
import type { RubricCategory } from "@/lib/types";

const FULL_RUBRIC: RubricCategory[] = [
  "empathy",
  "situationDiscovery",
  "problemDiscovery",
  "implication",
  "needPayoff",
  "meddicccCoverage",
  "technicalAccuracy",
  "relevance",
  "persuasion",
  "nextStep",
];

function grade(answer: string, rubric: RubricCategory[] = FULL_RUBRIC) {
  return gradeResponse({
    answer,
    rubric,
    contextKeywords: ["review", "release", "backlog"],
    modelAnswer: "model",
    nextBestQuestion: "next",
  });
}

describe("analyzeText", () => {
  it("separates open questions from closed questions", () => {
    const signals = analyzeText(
      "How does a change get reviewed today? Do you use pull requests?",
    );
    expect(signals.openQuestions).toHaveLength(1);
    expect(signals.closedQuestions).toHaveLength(1);
  });

  it("flags claims that cannot be defended", () => {
    const signals = analyzeText(
      "Devin guarantees 100% test coverage and replaces your engineers.",
    );
    expect(signals.unsupportedClaims.length).toBeGreaterThanOrEqual(3);
  });

  it("detects pitching before asking anything", () => {
    const pitchFirst = analyzeText(
      "Devin can implement tickets end to end. What does your release process look like?",
    );
    const askFirst = analyzeText(
      "What does your release process look like? Devin can implement tickets end to end.",
    );
    expect(pitchFirst.pitchedBeforeAsking).toBe(true);
    expect(askFirst.pitchedBeforeAsking).toBe(false);
  });
});

describe("gradeResponse", () => {
  it("is deterministic for the same answer", () => {
    const answer = "How does the review process work today, and what does the wait cost you per release?";
    expect(grade(answer)).toEqual(grade(answer));
  });

  it("scores a discovery answer above a pitch", () => {
    const discovery = grade(
      "That makes sense, and I would be cautious too. How does a change get from a ticket to production today? Where does it wait longest, and what has that delay cost you in missed roadmap commitments this quarter? If that wait halved, what would it mean for the release you have coming?",
    );
    const pitch = grade(
      "Devin can implement tickets end to end and it will 10x your team's productivity.",
    );
    expect(discovery.overall).toBeGreaterThan(pitch.overall);
  });

  it("penalises overclaiming on technical accuracy and persuasion", () => {
    const result = grade(
      "Devin guarantees no bugs and needs no code review at all.",
      ["technicalAccuracy", "persuasion"],
    );
    expect(result.unsupportedClaims.length).toBeGreaterThan(0);
    expect(result.overall).toBeLessThan(2);
  });

  it("reports a missing question when none is asked", () => {
    const result = grade("The review queue sounds slow.");
    expect(result.missing.join(" ")).toContain("did not ask a question");
  });

  it("rewards implication questions on the implication rubric", () => {
    const withImplication = grade(
      "What has that delay cost you in missed commitments this quarter?",
      ["implication"],
    );
    const withoutImplication = grade("Which tools do you use?", ["implication"]);
    expect(withImplication.overall).toBeGreaterThan(withoutImplication.overall);
  });

  it("gives an empty answer no credit", () => {
    expect(grade("").overall).toBe(0);
  });
});
