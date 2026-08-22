export type ModuleId = "A" | "B" | "C" | "D" | "E";

export type SkillId =
  | "technicalFluency"
  | "empathy"
  | "spin"
  | "meddiccc"
  | "objections"
  | "demos";

export const SKILL_LABELS: Record<SkillId, string> = {
  technicalFluency: "Technical fluency",
  empathy: "Empathy",
  spin: "SPIN discovery",
  meddiccc: "MEDDICCC qualification",
  objections: "Objection handling",
  demos: "Devin demos",
};

export type SpinCategory = "situation" | "problem" | "implication" | "needPayoff";

export const SPIN_LABELS: Record<SpinCategory, string> = {
  situation: "Situation",
  problem: "Problem",
  implication: "Implication",
  needPayoff: "Need-payoff",
};

export type MeddicccCategory =
  | "metrics"
  | "economicBuyer"
  | "decisionCriteria"
  | "decisionProcess"
  | "identifyPain"
  | "champion"
  | "competition"
  | "paperProcess"
  | "compellingEvent";

export const MEDDICCC_LABELS: Record<MeddicccCategory, string> = {
  metrics: "Metrics",
  economicBuyer: "Economic buyer",
  decisionCriteria: "Decision criteria",
  decisionProcess: "Decision process",
  identifyPain: "Identify pain",
  champion: "Champion",
  competition: "Competition",
  paperProcess: "Paper process",
  compellingEvent: "Compelling event",
};

export interface KnowledgeCheck {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  module: ModuleId;
  title: string;
  skills: SkillId[];
  /** Plain-English definition. */
  definition: string;
  /** Why a CTO cares. */
  whyCtoCares: string;
  /** How it relates to Devin. */
  devinConnection: string;
  example: string;
  misconception: string;
  knowledgeCheck: KnowledgeCheck;
  /** A question the learner can ask a customer. */
  customerQuestion: string;
  /** What asking that question sets up. */
  questionImplication: string;
  /** Productivity / risk / cost / speed framing. */
  businessImpact: string;
}

export interface ModuleMeta {
  id: ModuleId;
  title: string;
  summary: string;
}

export type QuestionType =
  | "multipleChoice"
  | "selectAll"
  | "rank"
  | "identifySpin"
  | "identifyMeddiccc"
  | "bestFollowUp"
  | "rewrite"
  | "scenario"
  | "shortAnswer";

interface BaseQuestion {
  id: string;
  type: QuestionType;
  skills: SkillId[];
  prompt: string;
  /** Optional customer line that sets up the question. */
  customerSays?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multipleChoice" | "bestFollowUp";
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface SelectAllQuestion extends BaseQuestion {
  type: "selectAll";
  options: string[];
  answerIndexes: number[];
  explanation: string;
}

export interface RankQuestion extends BaseQuestion {
  type: "rank";
  options: string[];
  /** Option indexes from best to worst. */
  correctOrder: number[];
  explanation: string;
}

export interface IdentifySpinQuestion extends BaseQuestion {
  type: "identifySpin";
  statement: string;
  answer: SpinCategory;
  explanation: string;
}

export interface IdentifyMeddicccQuestion extends BaseQuestion {
  type: "identifyMeddiccc";
  statement: string;
  answer: MeddicccCategory;
  explanation: string;
}

export interface FreeTextQuestion extends BaseQuestion {
  type: "rewrite" | "scenario" | "shortAnswer";
  /** Rubric categories that are graded for this question. */
  rubric: RubricCategory[];
  /** Keywords describing the buyer's stated situation, used for relevance scoring. */
  contextKeywords: string[];
  modelAnswer: string;
  nextBestQuestion: string;
  spinFocus?: SpinCategory;
  meddicccFocus?: MeddicccCategory[];
}

export type Question =
  | MultipleChoiceQuestion
  | SelectAllQuestion
  | RankQuestion
  | IdentifySpinQuestion
  | IdentifyMeddicccQuestion
  | FreeTextQuestion;

export interface Quiz {
  id: string;
  title: string;
  module: ModuleId;
  description: string;
  skills: SkillId[];
  questions: Question[];
}

export type RubricCategory =
  | "empathy"
  | "situationDiscovery"
  | "problemDiscovery"
  | "implication"
  | "needPayoff"
  | "meddicccCoverage"
  | "technicalAccuracy"
  | "relevance"
  | "persuasion"
  | "nextStep";

export const RUBRIC_LABELS: Record<RubricCategory, string> = {
  empathy: "Empathy",
  situationDiscovery: "Situation discovery",
  problemDiscovery: "Problem discovery",
  implication: "Implication",
  needPayoff: "Need-payoff",
  meddicccCoverage: "MEDDICCC coverage",
  technicalAccuracy: "Technical accuracy",
  relevance: "Relevance",
  persuasion: "Persuasion",
  nextStep: "Next-step quality",
};

export const RUBRIC_DESCRIPTIONS: Record<RubricCategory, string> = {
  empathy: "Acknowledges the buyer's concern without dismissing it",
  situationDiscovery: "Understands the current process",
  problemDiscovery: "Identifies friction, inefficiency, or failure",
  implication: "Explores business, financial, or strategic consequences",
  needPayoff: "Connects improvement to a desired outcome",
  meddicccCoverage:
    "Surfaces metrics, authority, process, pain, champion, or competition",
  technicalAccuracy: "Explains Devin and engineering concepts correctly",
  relevance: "Connects the response to the buyer's stated situation",
  persuasion: "Builds a credible case without overclaiming",
  nextStep: "Advances the conversation appropriately",
};

export interface PersonaRevealLayer {
  /** Topic this layer answers. */
  topic: string;
  /** Keywords that unlock the layer when the learner asks about it. */
  triggers: string[];
  /** What the persona says once unlocked. */
  reveal: string;
  /** Rubric-ish tags this reveal covers. */
  covers: (SpinCategory | MeddicccCategory)[];
  /** Only revealed if the question is open-ended. */
  requiresOpenQuestion?: boolean;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  priorities: string[];
  hiddenPain: string;
  currentWorkflow: string;
  objections: string[];
  decisionAuthority: string;
  buyingCriteria: string[];
  urgency: "low" | "medium" | "high";
  likelyCompetition: string[];
  opening: string;
  layers: PersonaRevealLayer[];
  /** Line used when the learner pitches too early. */
  pitchPushback: string;
  /** Line used when the learner makes a vague or unsupported claim. */
  vagueClaimChallenge: string;
  /** Line used when the learner asks a closed question. */
  closedQuestionResponse: string;
}

export interface Objection {
  id: string;
  objection: string;
  whyTheyAskIt: string;
  acknowledge: string;
  clarify: string;
  discoveryQuestion: string;
  devinWorkflow: string;
  evidenceOrNextStep: string;
  avoid: string[];
  contextKeywords: string[];
}

export interface DemoRecipe {
  id: string;
  pain: string;
  painKeywords: string[];
  demo: string;
  proves: string;
  setup: string[];
  steps: string[];
  narration: string;
  doesNotProve: string[];
  likelyObjections: string[];
  followUpQuestion: string;
}
