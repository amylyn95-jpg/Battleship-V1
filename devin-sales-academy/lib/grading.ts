import {
  ACCURATE_TERMS,
  CLOSED_QUESTION_STARTERS,
  DISMISSIVE_PHRASES,
  EMPATHY_PHRASES,
  IMPLICATION_LEXICON,
  MEDDICCC_LEXICON,
  NEED_PAYOFF_LEXICON,
  NEXT_STEP_MARKERS,
  OPEN_QUESTION_STARTERS,
  PITCH_MARKERS,
  SPIN_LEXICON,
  UNSUPPORTED_CLAIM_PATTERNS,
} from "./lexicons";
import type {
  MeddicccCategory,
  RubricCategory,
  SpinCategory,
} from "./types";

export interface TextSignals {
  text: string;
  normalized: string;
  words: number;
  sentences: string[];
  questions: string[];
  openQuestions: string[];
  closedQuestions: string[];
  empathyHits: string[];
  dismissiveHits: string[];
  pitchHits: string[];
  nextStepHits: string[];
  accurateTermHits: string[];
  unsupportedClaims: string[];
  spinHits: Record<SpinCategory, string[]>;
  meddicccHits: Record<MeddicccCategory, string[]>;
  /** True when a pitch marker appears before the first question. */
  pitchedBeforeAsking: boolean;
  numbersMentioned: boolean;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function hits(normalized: string, lexicon: string[]): string[] {
  return lexicon.filter((term) => normalized.includes(term));
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isOpenQuestion(question: string): boolean {
  const q = normalize(question).replace(/^[^a-z]*/, "");
  if (OPEN_QUESTION_STARTERS.some((s) => q.startsWith(s))) return true;
  // Open starters can also appear after a short lead-in ("and what does that cost?").
  return OPEN_QUESTION_STARTERS.some((s) =>
    new RegExp(`(^|[,;:] |\\band |\\bso |\\bbut )${s}\\b`).test(q),
  );
}

function isClosedQuestion(question: string): boolean {
  const q = normalize(question).replace(/^[^a-z]*/, "");
  return (
    !isOpenQuestion(question) &&
    CLOSED_QUESTION_STARTERS.some((s) => q.startsWith(`${s} `))
  );
}

export function analyzeText(text: string): TextSignals {
  const normalized = normalize(text);
  const sentences = splitSentences(text.trim());
  const questions = sentences.filter((s) => s.includes("?"));
  const firstQuestionIndex = sentences.findIndex((s) => s.includes("?"));
  const pitchHits = hits(normalized, PITCH_MARKERS);
  const pitchSentenceIndex = sentences.findIndex((s) =>
    PITCH_MARKERS.some((m) => normalize(s).includes(m)),
  );

  const spinHits = Object.fromEntries(
    (Object.keys(SPIN_LEXICON) as SpinCategory[]).map((key) => [
      key,
      hits(normalized, SPIN_LEXICON[key]),
    ]),
  ) as Record<SpinCategory, string[]>;

  const meddicccHits = Object.fromEntries(
    (Object.keys(MEDDICCC_LEXICON) as MeddicccCategory[]).map((key) => [
      key,
      hits(normalized, MEDDICCC_LEXICON[key]),
    ]),
  ) as Record<MeddicccCategory, string[]>;

  return {
    text,
    normalized,
    words: normalized ? normalized.split(" ").length : 0,
    sentences,
    questions,
    openQuestions: questions.filter(isOpenQuestion),
    closedQuestions: questions.filter(isClosedQuestion),
    empathyHits: hits(normalized, EMPATHY_PHRASES),
    dismissiveHits: hits(normalized, DISMISSIVE_PHRASES),
    pitchHits,
    nextStepHits: hits(normalized, NEXT_STEP_MARKERS),
    accurateTermHits: hits(normalized, ACCURATE_TERMS),
    unsupportedClaims: UNSUPPORTED_CLAIM_PATTERNS.filter((c) =>
      c.pattern.test(text),
    ).map((c) => c.why),
    spinHits,
    meddicccHits,
    pitchedBeforeAsking:
      pitchSentenceIndex >= 0 &&
      (firstQuestionIndex === -1 || pitchSentenceIndex < firstQuestionIndex),
    numbersMentioned: /\b\d/.test(text),
  };
}

export interface CategoryScore {
  category: RubricCategory;
  score: number;
  note: string;
}

export interface GradeResult {
  /** Mean of the graded categories, 0-5, rounded to one decimal. */
  overall: number;
  scores: CategoryScore[];
  strengths: string[];
  missing: string[];
  whyItMatters: string;
  strongerExample: string;
  nextBestQuestion: string;
  spinLabels: SpinCategory[];
  meddicccLabels: MeddicccCategory[];
  unsupportedClaims: string[];
}

export interface GradeInput {
  answer: string;
  rubric: RubricCategory[];
  /** Keywords describing the buyer's stated situation. */
  contextKeywords: string[];
  modelAnswer: string;
  nextBestQuestion: string;
  /** Extra context for the "why this matters" line. */
  whyItMatters?: string;
}

function clamp(score: number): number {
  return Math.max(0, Math.min(5, score));
}

function scoreFromHits(count: number, thresholds: [number, number, number, number]): number {
  if (count >= thresholds[3]) return 5;
  if (count >= thresholds[2]) return 4;
  if (count >= thresholds[1]) return 3;
  if (count >= thresholds[0]) return 2;
  return count > 0 ? 1 : 0;
}

function scoreEmpathy(s: TextSignals): CategoryScore {
  let score = scoreFromHits(s.empathyHits.length, [1, 2, 3, 4]);
  if (s.dismissiveHits.length > 0) score -= 3;
  if (s.pitchedBeforeAsking && s.empathyHits.length === 0) score -= 1;
  score = clamp(score);
  const note =
    s.dismissiveHits.length > 0
      ? `Dismissive phrasing ("${s.dismissiveHits[0]}") reads as brushing the concern aside.`
      : s.empathyHits.length === 0
        ? "No acknowledgement of the buyer's concern before responding."
        : score <= 2
          ? `Only a light acknowledgement ("${s.empathyHits[0]}") — a skeptical buyer needs to hear their concern repeated back in their own terms.`
          : `Acknowledged the concern (${s.empathyHits.slice(0, 2).join(", ")}) before responding.`;
  return { category: "empathy", score, note };
}

function scoreSituation(s: TextSignals): CategoryScore {
  const count = s.spinHits.situation.length;
  let score = scoreFromHits(count, [1, 2, 4, 6]);
  if (s.openQuestions.length === 0) score -= 1;
  score = clamp(score);
  return {
    category: "situationDiscovery",
    score,
    note:
      count === 0
        ? "Did not explore how things work today."
        : `Explored the current state (${s.spinHits.situation.slice(0, 3).join(", ")}).`,
  };
}

function scoreProblem(s: TextSignals): CategoryScore {
  const count = s.spinHits.problem.length;
  const score = clamp(scoreFromHits(count, [1, 2, 3, 5]));
  return {
    category: "problemDiscovery",
    score,
    note:
      count === 0
        ? "Did not name or probe the friction, inefficiency, or failure."
        : `Probed the friction (${s.spinHits.problem.slice(0, 3).join(", ")}).`,
  };
}

function scoreImplication(s: TextSignals): CategoryScore {
  const count = s.spinHits.implication.length;
  let score = scoreFromHits(count, [1, 2, 3, 5]);
  if (count > 0 && s.questions.length > 0) score += 1;
  score = clamp(score);
  return {
    category: "implication",
    score,
    note:
      count === 0
        ? "No business, financial, or strategic consequence explored — this is the most commonly skipped step."
        : `Connected the problem to consequence (${IMPLICATION_LEXICON.filter((t) => s.normalized.includes(t)).slice(0, 3).join(", ")}).`,
  };
}

function scoreNeedPayoff(s: TextSignals): CategoryScore {
  const count = s.spinHits.needPayoff.length;
  const score = clamp(scoreFromHits(count, [1, 2, 3, 4]));
  return {
    category: "needPayoff",
    score,
    note:
      count === 0
        ? "Did not invite the buyer to describe the value of solving it."
        : `Invited the buyer to state the upside (${NEED_PAYOFF_LEXICON.filter((t) => s.normalized.includes(t)).slice(0, 2).join(", ")}).`,
  };
}

function scoreMeddiccc(s: TextSignals): CategoryScore {
  const covered = (Object.keys(s.meddicccHits) as MeddicccCategory[]).filter(
    (k) => s.meddicccHits[k].length > 0,
  );
  const score = clamp(scoreFromHits(covered.length, [1, 2, 3, 4]));
  return {
    category: "meddicccCoverage",
    score,
    note:
      covered.length === 0
        ? "No qualification ground covered — no metric, authority, process, pain, champion, or competition."
        : `Touched ${covered.length} qualification area${covered.length > 1 ? "s" : ""}.`,
  };
}

function scoreTechnicalAccuracy(s: TextSignals): CategoryScore {
  let score = scoreFromHits(s.accurateTermHits.length, [1, 2, 3, 4]);
  if (s.accurateTermHits.length === 0) score = 3; // saying nothing technical is not inaccurate
  score -= s.unsupportedClaims.length * 2;
  score = clamp(score);
  return {
    category: "technicalAccuracy",
    score,
    note:
      s.unsupportedClaims.length > 0
        ? "Contains a claim that is too strong to defend to a technical buyer."
        : s.accurateTermHits.length === 0
          ? "No technical detail either way — accurate, but you missed a chance to sound credible."
          : `Used concrete, defensible vocabulary (${s.accurateTermHits.slice(0, 3).join(", ")}).`,
  };
}

function scoreRelevance(s: TextSignals, contextKeywords: string[]): CategoryScore {
  const matched = contextKeywords.filter((k) => s.normalized.includes(k.toLowerCase()));
  let score = scoreFromHits(matched.length, [1, 2, 3, 4]);
  if (s.words < 12) score -= 1;
  score = clamp(score);
  return {
    category: "relevance",
    score,
    note:
      matched.length === 0
        ? "Did not connect back to anything the buyer actually said — this is what makes a response feel generic."
        : `Anchored in what they said (${matched.slice(0, 3).join(", ")}).`,
  };
}

function scorePersuasion(s: TextSignals): CategoryScore {
  let score = 3;
  if (s.unsupportedClaims.length > 0) score -= 2 * s.unsupportedClaims.length;
  if (s.pitchedBeforeAsking) score -= 2;
  if (s.empathyHits.length > 0) score += 1;
  if (s.numbersMentioned) score += 1;
  if (s.questions.length > 0) score += 1;
  if (s.words < 15) score -= 1;
  score = clamp(score);
  return {
    category: "persuasion",
    score,
    note:
      s.unsupportedClaims.length > 0
        ? "Overclaiming undercuts the case — a narrower, verifiable statement is more persuasive."
        : s.pitchedBeforeAsking
          ? "Pitched before asking, so the case rests on your assertion rather than their words."
          : "Built the case without overclaiming.",
  };
}

function scoreNextStep(s: TextSignals): CategoryScore {
  const count = s.nextStepHits.length;
  let score = scoreFromHits(count, [1, 2, 3, 4]);
  if (s.questions.length > 0) score += 1;
  score = clamp(score);
  return {
    category: "nextStep",
    score,
    note:
      count === 0 && s.questions.length === 0
        ? "Nothing here moves the conversation forward — no question and no proposed next step."
        : count === 0
          ? "Asked a question but did not propose a concrete next step."
          : `Proposed a way forward (${s.nextStepHits.slice(0, 2).join(", ")}).`,
  };
}

const SCORERS: Record<
  RubricCategory,
  (s: TextSignals, contextKeywords: string[]) => CategoryScore
> = {
  empathy: (s) => scoreEmpathy(s),
  situationDiscovery: (s) => scoreSituation(s),
  problemDiscovery: (s) => scoreProblem(s),
  implication: (s) => scoreImplication(s),
  needPayoff: (s) => scoreNeedPayoff(s),
  meddicccCoverage: (s) => scoreMeddiccc(s),
  technicalAccuracy: (s) => scoreTechnicalAccuracy(s),
  relevance: (s, ctx) => scoreRelevance(s, ctx),
  persuasion: (s) => scorePersuasion(s),
  nextStep: (s) => scoreNextStep(s),
};

export function gradeResponse(input: GradeInput): GradeResult {
  const signals = analyzeText(input.answer);
  const scores = input.rubric.map((category) =>
    signals.words === 0
      ? {
          category,
          score: 0,
          note: "Nothing was said, so there is nothing to credit.",
        }
      : SCORERS[category](signals, input.contextKeywords),
  );
  const overall =
    scores.length === 0
      ? 0
      : Math.round(
          (scores.reduce((sum, s) => sum + s.score, 0) / scores.length) * 10,
        ) / 10;

  const strengths = scores.filter((s) => s.score >= 4).map((s) => s.note);
  const missing = scores.filter((s) => s.score <= 2).map((s) => s.note);

  if (signals.questions.length === 0) {
    missing.push(
      "You did not ask a question. A response with no question hands the conversation back with nothing gained.",
    );
  } else if (signals.openQuestions.length === 0) {
    missing.push(
      "Your questions were closed (yes/no). Open questions produce information; closed ones produce agreement.",
    );
  } else {
    strengths.push(
      `Asked ${signals.openQuestions.length} open question${signals.openQuestions.length > 1 ? "s" : ""}.`,
    );
  }

  const spinLabels = (Object.keys(signals.spinHits) as SpinCategory[]).filter(
    (k) => signals.spinHits[k].length > 0,
  );
  const meddicccLabels = (
    Object.keys(signals.meddicccHits) as MeddicccCategory[]
  ).filter((k) => signals.meddicccHits[k].length > 0);

  return {
    overall,
    scores,
    strengths: strengths.length ? strengths : ["Nothing scored strongly yet."],
    missing: missing.length ? missing : ["Nothing significant missing."],
    whyItMatters:
      input.whyItMatters ??
      "A buyer who states the consequence themselves does not need convincing later; a buyer who only heard your claims does.",
    strongerExample: input.modelAnswer,
    nextBestQuestion: input.nextBestQuestion,
    spinLabels,
    meddicccLabels,
    unsupportedClaims: signals.unsupportedClaims,
  };
}
