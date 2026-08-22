import { describe, expect, it } from "vitest";
import { objections, personas } from "@/content";
import { demoRecipes } from "@/content/demos";
import { DEBRIEF_FIELDS, gradeDebrief } from "@/lib/debrief";
import { matchDemos } from "@/lib/demo-coach";
import { reportRoleplay, respond, startRoleplay } from "@/lib/roleplay";

const cto = personas[0];

describe("roleplay engine", () => {
  it("reveals hidden pain only when the right topic is asked about", () => {
    const layer = cto.layers[0];
    const asked = respond(
      cto,
      startRoleplay(cto),
      `What does ${layer.triggers[0]} look like for you today?`,
    );
    expect(asked.unlockedTopics).toContain(layer.topic);

    const irrelevant = respond(cto, startRoleplay(cto), "What is the weather like?");
    expect(irrelevant.unlockedTopics).toHaveLength(0);
  });

  it("challenges an unsupported claim instead of revealing anything", () => {
    const state = respond(
      cto,
      startRoleplay(cto),
      "Devin guarantees 100% fewer bugs and replaces your engineers.",
    );
    expect(state.turns[0].personaReply).toBe(cto.vagueClaimChallenge);
    expect(state.unlockedTopics).toHaveLength(0);
  });

  it("pushes back when the learner pitches before asking", () => {
    const state = respond(cto, startRoleplay(cto), "Devin can implement whole tickets.");
    expect(state.turns[0].personaReply).toBe(cto.pitchPushback);
  });

  it("reports what was uncovered and what was missed", () => {
    let state = startRoleplay(cto);
    for (const layer of cto.layers) {
      state = respond(cto, state, `What about ${layer.triggers[0]}? How does that work?`);
    }
    const report = reportRoleplay(cto, state);
    expect(report.discovered.length).toBeGreaterThan(0);
    expect(report.discovered.length + report.missed.length).toBe(cto.layers.length);
    expect(report.grade.overall).toBeGreaterThan(0);
  });
});

describe("debrief grading", () => {
  it("scores an empty debrief at 0 and lists the deal risks", () => {
    const report = gradeDebrief({});
    expect(report.score).toBe(0);
    expect(report.risks.length).toBeGreaterThanOrEqual(4);
    expect(report.meddicccCovered).toHaveLength(0);
  });

  it("rewards specific answers with numbers and dates", () => {
    const values = Object.fromEntries(
      DEBRIEF_FIELDS.map((field) => [
        field.id,
        "Cycle time is 11 days today and the compliance audit lands in Q3, confirmed Thursday with the platform lead.",
      ]),
    );
    const report = gradeDebrief(values);
    expect(report.score).toBe(100);
    expect(report.risks).toHaveLength(0);
  });

  it("treats a hedged answer as a gap, not a detail", () => {
    const report = gradeDebrief({ economicBuyer: "Not sure, I think maybe the CTO" });
    const assessment = report.assessments.find((a) => a.field.id === "economicBuyer");
    expect(assessment?.quality).toBeLessThan(2);
    expect(report.meddicccGaps).toContain("economicBuyer");
  });
});

describe("demo coach matching", () => {
  it("matches a described pain to a demo recipe", () => {
    const matches = matchDemos(
      "Work sits in the backlog for months because the team has no capacity and roadmap commitments slipped.",
    );
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].hits.length).toBeGreaterThan(0);
  });

  it("returns nothing when no pain is described", () => {
    expect(matchDemos("They seemed nice and the call went well.")).toHaveLength(0);
  });
});

describe("practice content", () => {
  it("offers at least five objections with a full framework", () => {
    expect(objections.length).toBeGreaterThanOrEqual(5);
    for (const objection of objections) {
      expect(objection.acknowledge.length).toBeGreaterThan(0);
      expect(objection.discoveryQuestion).toContain("?");
      expect(objection.avoid.length).toBeGreaterThan(0);
    }
  });

  it("states what each demo does not prove", () => {
    for (const recipe of demoRecipes) {
      expect(recipe.doesNotProve.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
    }
  });
});
