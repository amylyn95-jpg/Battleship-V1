import { analyzeText, gradeResponse, type GradeResult } from "./grading";
import type {
  MeddicccCategory,
  Persona,
  RubricCategory,
  SpinCategory,
} from "./types";

export interface RoleplayTurn {
  learner: string;
  personaReply: string;
  /** Layer topics unlocked by this turn. */
  unlocked: string[];
  /** Why the persona replied the way it did. */
  coachNote: string;
}

export interface RoleplayState {
  personaId: string;
  turns: RoleplayTurn[];
  unlockedTopics: string[];
}

export function startRoleplay(persona: Persona): RoleplayState {
  return { personaId: persona.id, turns: [], unlockedTopics: [] };
}

const ROLEPLAY_RUBRIC: RubricCategory[] = [
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

export function respond(
  persona: Persona,
  state: RoleplayState,
  learnerTurn: string,
): RoleplayState {
  const signals = analyzeText(learnerTurn);
  const locked = persona.layers.filter(
    (layer) => !state.unlockedTopics.includes(layer.topic),
  );

  const matched = locked.filter((layer) =>
    layer.triggers.some((trigger) => signals.normalized.includes(trigger)),
  );

  let personaReply: string;
  let unlocked: string[] = [];
  let coachNote: string;

  if (signals.unsupportedClaims.length > 0) {
    personaReply = persona.vagueClaimChallenge;
    coachNote = `They pushed back because the claim is not defensible: ${signals.unsupportedClaims[0]}`;
  } else if (signals.pitchedBeforeAsking && signals.openQuestions.length === 0) {
    personaReply = persona.pitchPushback;
    coachNote =
      "You described the product before understanding their situation, so they defended their status quo.";
  } else if (matched.length > 0) {
    const gated = matched.filter(
      (layer) => layer.requiresOpenQuestion && signals.openQuestions.length === 0,
    );
    const usable = matched.filter((layer) => !gated.includes(layer));
    if (usable.length === 0) {
      personaReply = persona.closedQuestionResponse;
      coachNote =
        "You touched the right subject, but a closed question only bought a yes/no. Ask it open.";
    } else {
      const reveal = usable.slice(0, 2);
      personaReply = reveal.map((layer) => layer.reveal).join(" ");
      unlocked = reveal.map((layer) => layer.topic);
      coachNote = `You opened up: ${unlocked.join(", ")}.`;
    }
  } else if (signals.pitchedBeforeAsking) {
    personaReply = persona.pitchPushback;
    coachNote =
      "You described the product before understanding their situation, so they defended their status quo.";
  } else if (signals.questions.length === 0) {
    personaReply =
      "Right. Was there something you wanted to ask me? I have about ten minutes.";
    coachNote = "No question means no new information and no progress.";
  } else if (signals.closedQuestions.length > 0) {
    personaReply = persona.closedQuestionResponse;
    coachNote = "Closed question — you got an answer but learned very little.";
  } else {
    personaReply =
      "I am not sure that is the most useful thing for us to talk about. The thing I actually care about is whether my team's work gets out faster without more risk.";
    coachNote =
      "Open question, but not aimed at anything they care about. Aim at their priorities.";
  }

  return {
    ...state,
    turns: [...state.turns, { learner: learnerTurn, personaReply, unlocked, coachNote }],
    unlockedTopics: [...state.unlockedTopics, ...unlocked],
  };
}

export interface RoleplayReport {
  grade: GradeResult;
  /** Reveal layers the learner unlocked. */
  discovered: string[];
  /** Reveal layers still hidden. */
  missed: string[];
  spinCoverage: SpinCategory[];
  meddicccCoverage: MeddicccCategory[];
  turnCount: number;
}

export function reportRoleplay(
  persona: Persona,
  state: RoleplayState,
): RoleplayReport {
  const transcript = state.turns.map((t) => t.learner).join(" ");
  const grade = gradeResponse({
    answer: transcript,
    rubric: ROLEPLAY_RUBRIC,
    contextKeywords: [
      ...persona.priorities,
      ...persona.buyingCriteria,
      ...persona.likelyCompetition,
    ]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length > 5),
    modelAnswer: `A strong version of this conversation acknowledges ${persona.name}'s concern, asks how the work flows today, names the friction, then asks what that friction costs before mentioning Devin at all. It ends with a bounded next step: "${persona.buyingCriteria[0]}".`,
    nextBestQuestion: persona.layers[0]
      ? `Ask about ${persona.layers[0].topic}.`
      : "Ask what the delay costs them per quarter.",
    whyItMatters: `${persona.name} decides on evidence, not enthusiasm. The consequence has to come out of their mouth.`,
  });

  const unlockedLayers = persona.layers.filter((l) =>
    state.unlockedTopics.includes(l.topic),
  );
  const covered = new Set(unlockedLayers.flatMap((l) => l.covers));

  const spinKeys: SpinCategory[] = [
    "situation",
    "problem",
    "implication",
    "needPayoff",
  ];

  return {
    grade,
    discovered: unlockedLayers.map((l) => l.topic),
    missed: persona.layers
      .filter((l) => !state.unlockedTopics.includes(l.topic))
      .map((l) => l.topic),
    spinCoverage: [...covered].filter((c): c is SpinCategory =>
      spinKeys.includes(c as SpinCategory),
    ),
    meddicccCoverage: [...covered].filter(
      (c): c is MeddicccCategory => !spinKeys.includes(c as SpinCategory),
    ),
    turnCount: state.turns.length,
  };
}
