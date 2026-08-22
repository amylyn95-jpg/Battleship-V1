import { analyzeText } from "./grading";
import { MEDDICCC_LABELS, type MeddicccCategory, type SpinCategory } from "./types";

export interface DebriefField {
  id: DebriefFieldId;
  label: string;
  hint: string;
  placeholder: string;
}

export type DebriefFieldId =
  | "situation"
  | "problem"
  | "implication"
  | "metrics"
  | "economicBuyer"
  | "decisionProcess"
  | "champion"
  | "competition"
  | "compellingEvent"
  | "nextStep";

export const DEBRIEF_FIELDS: DebriefField[] = [
  {
    id: "situation",
    label: "What is their current process?",
    hint: "How work actually flows today — tools, steps, who does what.",
    placeholder:
      "Twelve engineers, two-week releases, every change reviewed by one of three seniors...",
  },
  {
    id: "problem",
    label: "What problem did they admit to?",
    hint: "Their words, not your interpretation.",
    placeholder: "Review queues sit for three days because seniors are on-call...",
  },
  {
    id: "implication",
    label: "What did they say it costs them?",
    hint: "Money, time, missed commitments, risk. If you did not ask, say so.",
    placeholder: "Two of four roadmap commitments slipped last quarter...",
  },
  {
    id: "metrics",
    label: "What metric would they measure success by?",
    hint: "A number they already track, with today's baseline.",
    placeholder: "Cycle time from ticket to production, currently 11 days...",
  },
  {
    id: "economicBuyer",
    label: "Who can approve the spend?",
    hint: "Name and role, and whether you have met them.",
    placeholder: "CTO controls the tooling budget; I have not met her...",
  },
  {
    id: "decisionProcess",
    label: "What has to happen for them to buy?",
    hint: "Steps, sequence, and who is involved at each one.",
    placeholder: "Security review, then a 30-day trial, then procurement...",
  },
  {
    id: "champion",
    label: "Who feels this pain most acutely?",
    hint: "The person who would argue for you internally.",
    placeholder: "The platform lead who does most of the reviews...",
  },
  {
    id: "competition",
    label: "What are the alternatives, including doing nothing?",
    hint: "Other tools, in-house work, contractors, or the status quo.",
    placeholder: "They already pay for Copilot, and the default is to hire two more engineers...",
  },
  {
    id: "compellingEvent",
    label: "Why would they act now rather than next year?",
    hint: "A date, deadline, or event that creates urgency.",
    placeholder: "A compliance audit in Q3 requires an audit trail on every change...",
  },
  {
    id: "nextStep",
    label: "What is the agreed next step?",
    hint: "Who, what, and when — not 'they will get back to me'.",
    placeholder:
      "Thursday 3pm with the platform lead to scope one bounded ticket...",
  },
];

const FIELD_TO_MEDDICCC: Partial<Record<DebriefFieldId, MeddicccCategory>> = {
  problem: "identifyPain",
  metrics: "metrics",
  economicBuyer: "economicBuyer",
  decisionProcess: "decisionProcess",
  champion: "champion",
  competition: "competition",
  compellingEvent: "compellingEvent",
};

const FIELD_TO_SPIN: Partial<Record<DebriefFieldId, SpinCategory>> = {
  situation: "situation",
  problem: "problem",
  implication: "implication",
};

export interface FieldAssessment {
  field: DebriefField;
  /** 0-3: 0 blank, 1 vague, 2 partial, 3 specific. */
  quality: 0 | 1 | 2 | 3;
  note: string;
}

export interface DebriefReport {
  /** 0-100 completeness and specificity of the qualification picture. */
  score: number;
  assessments: FieldAssessment[];
  meddicccCovered: MeddicccCategory[];
  meddicccGaps: MeddicccCategory[];
  spinGaps: SpinCategory[];
  risks: string[];
  nextActions: string[];
}

const VAGUE_MARKERS = [
  "not sure",
  "unsure",
  "did not ask",
  "didn't ask",
  "unknown",
  "n/a",
  "tbd",
  "no idea",
  "probably",
  "i think",
  "they will get back",
  "follow up later",
  "some",
];

function assess(field: DebriefField, value: string): FieldAssessment {
  const text = value.trim();
  if (text.length === 0) {
    return { field, quality: 0, note: "Blank — this is a gap, not a detail." };
  }
  const signals = analyzeText(text);
  const vague = VAGUE_MARKERS.some((m) => signals.normalized.includes(m));
  const specific =
    signals.numbersMentioned ||
    /\b(monday|tuesday|wednesday|thursday|friday|q[1-4]|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(
      text,
    );

  if (vague && !specific) {
    return {
      field,
      quality: 1,
      note: "Recorded, but hedged. A hedge here means you do not actually know it yet.",
    };
  }
  if (signals.words < 8) {
    return {
      field,
      quality: 1,
      note: "Too thin to act on — one clause is not a qualification answer.",
    };
  }
  if (specific) {
    return {
      field,
      quality: 3,
      note: "Specific, with a number or a date. This is what makes a forecast defensible.",
    };
  }
  return {
    field,
    quality: 2,
    note: "Reasonable detail, but no number or date to anchor it.",
  };
}

export function gradeDebrief(values: Record<string, string>): DebriefReport {
  const assessments = DEBRIEF_FIELDS.map((field) =>
    assess(field, values[field.id] ?? ""),
  );
  const score = Math.round(
    (assessments.reduce((sum, a) => sum + a.quality, 0) /
      (assessments.length * 3)) *
      100,
  );

  const meddicccCovered: MeddicccCategory[] = [];
  const meddicccGaps: MeddicccCategory[] = [];
  const spinGaps: SpinCategory[] = [];

  for (const a of assessments) {
    const meddiccc = FIELD_TO_MEDDICCC[a.field.id];
    if (meddiccc) {
      (a.quality >= 2 ? meddicccCovered : meddicccGaps).push(meddiccc);
    }
    const spin = FIELD_TO_SPIN[a.field.id];
    if (spin && a.quality < 2) spinGaps.push(spin);
  }

  const risks: string[] = [];
  const byId = new Map(assessments.map((a) => [a.field.id, a]));
  if ((byId.get("implication")?.quality ?? 0) < 2) {
    risks.push(
      "No cost of the problem. Without it, this deal has no reason to be funded ahead of anything else.",
    );
  }
  if ((byId.get("economicBuyer")?.quality ?? 0) < 2) {
    risks.push(
      "No identified economic buyer. You are selling to someone who can say no but not yes.",
    );
  }
  if ((byId.get("compellingEvent")?.quality ?? 0) < 2) {
    risks.push(
      "No compelling event. This is the single best predictor of a deal that slips a quarter.",
    );
  }
  if ((byId.get("nextStep")?.quality ?? 0) < 2) {
    risks.push(
      "No concrete next step with a date and a name. The deal is stalled and you may not know it yet.",
    );
  }
  if ((byId.get("competition")?.quality ?? 0) < 2) {
    risks.push(
      "No named alternative. Doing nothing is always the incumbent and you have not addressed it.",
    );
  }

  const nextActions = assessments
    .filter((a) => a.quality < 2)
    .slice(0, 4)
    .map((a) => `Next call: get a specific answer to "${a.field.label}"`);

  if (nextActions.length === 0) {
    nextActions.push(
      "The picture is complete enough to forecast. Confirm the next step in writing today.",
    );
  }

  return {
    score,
    assessments,
    meddicccCovered,
    meddicccGaps,
    spinGaps,
    risks,
    nextActions,
  };
}

export function meddicccLabel(category: MeddicccCategory): string {
  return MEDDICCC_LABELS[category];
}
