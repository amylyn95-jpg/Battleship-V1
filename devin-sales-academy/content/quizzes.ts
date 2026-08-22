import type { Quiz } from "@/lib/types";

export const quizzes: Quiz[] = [
  {
    id: "quiz-engineering-basics",
    title: "Engineering fundamentals",
    module: "A",
    description:
      "Can you describe branches, pull requests, tests, and deployment accurately enough to talk to an engineer?",
    skills: ["technicalFluency"],
    questions: [
      {
        id: "q-a-1",
        type: "multipleChoice",
        skills: ["technicalFluency"],
        prompt:
          "A CTO asks what happens to a change before customers see it. Which answer is both accurate and reassuring?",
        options: [
          "It goes live as soon as the code is written.",
          "It sits on a branch (a separate workspace for changes) until a reviewer approves the pull request and it is merged and deployed.",
          "The tests deploy it automatically once they pass.",
          "It depends entirely on the AI tool being used.",
        ],
        answerIndex: 1,
        explanation:
          "Branch, review, merge, deploy is the sequence. Being precise here is the fastest way to sound credible with a technical buyer.",
      },
      {
        id: "q-a-2",
        type: "selectAll",
        skills: ["technicalFluency"],
        prompt:
          "Which of these are true limits you should state honestly to an engineer? (Select all that apply.)",
        options: [
          "Passing tests only prove the behaviours someone wrote tests for.",
          "A green build proves the app assembles, not that the feature is correct.",
          "A rollback fully undoes every kind of change, including data changes.",
          "A browser recording proves the specific flow shown, not the whole app.",
        ],
        answerIndexes: [0, 1, 3],
        explanation:
          "Rollback restores code but data changes may be irreversible. Overstating rollback is a fast way to lose an engineer's trust.",
      },
      {
        id: "q-a-3",
        type: "rank",
        skills: ["technicalFluency", "spin"],
        prompt:
          "Rank these discovery questions from most to least valuable in a first call with a VP of Engineering.",
        options: [
          "How many bugs are in your backlog?",
          "How does a change get from ticket to production today, and who touches it?",
          "Where does a change usually wait the longest, and what does that delay cost you?",
          "Do you use Git?",
        ],
        correctOrder: [2, 1, 0, 3],
        explanation:
          "Consequence-bearing questions rank highest, then workflow mapping, then counts, then trivia they will find patronizing.",
      },
      {
        id: "q-a-4",
        type: "multipleChoice",
        skills: ["technicalFluency", "empathy"],
        prompt:
          "A senior developer says: 'Our codebase is too complex for an AI.' Which reply is best?",
        options: [
          "Devin handles codebases of any complexity.",
          "Which part would you least trust it on? I would rather start somewhere bounded and let you judge the output.",
          "Most codebases people call complex really are not.",
          "Complexity is exactly why you need this.",
        ],
        answerIndex: 1,
        explanation:
          "Respecting their expertise and proposing a bounded test keeps the conversation open. Contradicting them ends it.",
      },
    ],
  },
  {
    id: "quiz-spin",
    title: "SPIN discovery",
    module: "C",
    description:
      "Classify questions, spot premature pitching, and write your own Implication question.",
    skills: ["spin"],
    questions: [
      {
        id: "q-c-1",
        type: "identifySpin",
        skills: ["spin"],
        prompt: "Which SPIN category does this question belong to?",
        statement:
          "What has that review delay cost you in features released per quarter?",
        answer: "implication",
        explanation:
          "It connects a known problem to a business consequence, which is the definition of an Implication question.",
      },
      {
        id: "q-c-2",
        type: "identifySpin",
        skills: ["spin"],
        prompt: "Which SPIN category does this question belong to?",
        statement:
          "How many engineers contribute to this repository, and how are changes reviewed today?",
        answer: "situation",
        explanation:
          "It maps the current state without judging it, which is a Situation question.",
      },
      {
        id: "q-c-3",
        type: "identifySpin",
        skills: ["spin"],
        prompt: "Which SPIN category does this question belong to?",
        statement:
          "If that bottleneck eased, what would your team be able to take on that it cannot today?",
        answer: "needPayoff",
        explanation:
          "It asks the buyer to describe the value of solving the problem — Need-payoff.",
      },
      {
        id: "q-c-4",
        type: "bestFollowUp",
        skills: ["spin", "empathy"],
        customerSays:
          "Honestly, our releases keep slipping. Reviews pile up and nobody has time.",
        prompt: "What is the best next response?",
        options: [
          "Devin can open smaller pull requests with tests already run, which speeds up review.",
          "That sounds frustrating. What has the slipping actually cost you — features pulled from a quarter, or commitments you had to walk back?",
          "How many engineers do you have?",
          "Most teams we talk to have this problem.",
        ],
        answerIndex: 1,
        explanation:
          "They have given you a Problem. The value is in the Implication, not in pitching a capability one sentence later.",
      },
      {
        id: "q-c-5",
        type: "rewrite",
        skills: ["spin"],
        customerSays:
          "Our QA person spends about a day and a half clicking through the app before every release.",
        prompt:
          "Rewrite this weak question so it explores the business consequence: 'Would you like to automate that?'",
        rubric: ["implication", "relevance", "problemDiscovery", "persuasion"],
        contextKeywords: [
          "qa",
          "manual",
          "clicking",
          "release",
          "day",
          "testing",
          "regression",
        ],
        modelAnswer:
          "When that day and a half of manual checking sits in front of every release, what does it push out — how much later does a release actually reach customers, and what does your QA person not get to do instead?",
        nextBestQuestion:
          "How many releases a month is that, and is the delay ever the reason something misses a customer commitment?",
        spinFocus: "implication",
        meddicccFocus: ["metrics", "identifyPain"],
      },
      {
        id: "q-c-6",
        type: "scenario",
        skills: ["spin", "empathy", "objections"],
        customerSays:
          "Our developers already use AI tools. I'm not sure we need another one.",
        prompt:
          "Write your response. Acknowledge their investment and open up discovery rather than attacking the competitor.",
        rubric: [
          "empathy",
          "situationDiscovery",
          "problemDiscovery",
          "relevance",
          "persuasion",
          "nextStep",
        ],
        contextKeywords: ["ai", "tools", "developers", "already", "copilot", "assistant"],
        modelAnswer:
          "That makes sense, and it is good that your team already has something working for them. What kind of work do those tools help with most — and where do your engineers still have to step in and take over manually? I would rather understand where the gap is than assume there is one.",
        nextBestQuestion:
          "Of the work where engineers still have to take over, which piece is the most repetitive?",
        spinFocus: "situation",
        meddicccFocus: ["competition"],
      },
    ],
  },
  {
    id: "quiz-meddiccc",
    title: "MEDDICCC qualification",
    module: "D",
    description:
      "Classify what a buyer just told you, and practise asking about authority and process without being clumsy.",
    skills: ["meddiccc"],
    questions: [
      {
        id: "q-d-1",
        type: "identifyMeddiccc",
        skills: ["meddiccc"],
        prompt: "Which MEDDICCC category does this belong to?",
        statement:
          "Manual regression testing takes two engineers about 24 hours in total per release.",
        answer: "metrics",
        explanation:
          "A specific, countable number the buyer already tracks is a Metric — and a much stronger anchor than a productivity percentage.",
      },
      {
        id: "q-d-2",
        type: "identifyMeddiccc",
        skills: ["meddiccc"],
        prompt: "Which MEDDICCC category does this belong to?",
        statement:
          "Anything that touches the code has to go through our security architecture review before we can trial it.",
        answer: "paperProcess",
        explanation:
          "Security review and contracting sit in the Paper process, and it is usually the longest step for a tool with repository access.",
      },
      {
        id: "q-d-3",
        type: "identifyMeddiccc",
        skills: ["meddiccc"],
        prompt: "Which MEDDICCC category does this belong to?",
        statement:
          "We have a hiring freeze but the same roadmap commitments for next quarter.",
        answer: "compellingEvent",
        explanation:
          "A dated business reality that creates urgency is a Compelling event. It also implies capacity pain.",
      },
      {
        id: "q-d-4",
        type: "identifyMeddiccc",
        skills: ["meddiccc"],
        prompt: "Which MEDDICCC category does this belong to?",
        statement:
          "Our platform lead would have to be convinced; she is the one everyone listens to on tooling.",
        answer: "champion",
        explanation:
          "A credible internal person who can carry the case is a potential Champion — motivation plus influence.",
      },
      {
        id: "q-d-5",
        type: "multipleChoice",
        skills: ["meddiccc", "empathy"],
        prompt:
          "You need to understand budget authority without insulting your contact. Which question is best?",
        options: [
          "Are you the decision maker here?",
          "Who else is usually involved when spend at this level gets approved?",
          "Do you have budget for this?",
          "Can you sign a contract this quarter?",
        ],
        answerIndex: 1,
        explanation:
          "Asking about the process rather than the person gets the same information without implying they lack authority.",
      },
      {
        id: "q-d-6",
        type: "shortAnswer",
        skills: ["meddiccc", "spin"],
        customerSays:
          "This is interesting. Send me some information and I'll share it internally.",
        prompt:
          "Write a response that advances the deal: agree a concrete next step and surface the decision process.",
        rubric: [
          "empathy",
          "meddicccCoverage",
          "nextStep",
          "relevance",
          "persuasion",
        ],
        contextKeywords: [
          "information",
          "internally",
          "share",
          "interesting",
          "send",
        ],
        modelAnswer:
          "Happy to send something over — it will land better if I know who is reading it. Who internally would need to be convinced, and what would they want it to answer? And if the material does its job, what usually happens next in your process: a technical evaluation, a security review, or something else?",
        nextBestQuestion:
          "Would it be worth putting 30 minutes with your platform lead in the diary so they can push back directly?",
        meddicccFocus: ["decisionProcess", "economicBuyer", "champion"],
      },
    ],
  },
  {
    id: "quiz-devin-claims",
    title: "Devin claims and objections",
    module: "B",
    description:
      "Practise describing Devin accurately, without unsupported claims, under pressure.",
    skills: ["technicalFluency", "objections", "demos"],
    questions: [
      {
        id: "q-b-1",
        type: "multipleChoice",
        skills: ["technicalFluency", "objections"],
        prompt: "Which of these statements is safe to make?",
        options: [
          "Devin will cut your engineering costs by 40%.",
          "Devin works in your repository, opens pull requests, runs your tests and linter, and its work goes through your existing review process.",
          "Devin never introduces bugs.",
          "Devin replaces the need for code review.",
        ],
        answerIndex: 1,
        explanation:
          "Describing the mechanics is verifiable. Numbers you cannot source and guarantees you cannot honour end the conversation with a technical buyer.",
      },
      {
        id: "q-b-2",
        type: "selectAll",
        skills: ["demos", "objections"],
        prompt:
          "A customer's pain is 'we don't trust AI-generated changes'. Which demonstrations actually address that? (Select all that apply.)",
        options: [
          "Devin runs the existing tests and shows the output.",
          "Devin explains the diff, the behaviour change, and the risk.",
          "Devin ships a large refactor quickly.",
          "Devin reviews its own work and fixes what it flags.",
        ],
        answerIndexes: [0, 1, 3],
        explanation:
          "Speed on a large refactor makes a trust concern worse. Evidence, explanation, and self-review address it directly.",
      },
      {
        id: "q-b-3",
        type: "bestFollowUp",
        skills: ["objections", "empathy"],
        customerSays:
          "We can't give an external tool access to our source code. Full stop.",
        prompt: "What is the best next response?",
        options: [
          "Everyone says that at first, and then they get comfortable.",
          "That is the right thing to be careful about. What does your security review normally require from a vendor at this stage, and who would need to be involved?",
          "The product is SOC 2 compliant, so it is fine.",
          "Could you use it on a less important repository instead?",
        ],
        answerIndex: 1,
        explanation:
          "Acknowledge, then convert the objection into their own process. Dismissing it or leading with a certification badge reads as evasive.",
      },
      {
        id: "q-b-4",
        type: "scenario",
        skills: ["objections", "empathy", "demos"],
        customerSays:
          "My engineers think this is a headcount play. They're not going to cooperate.",
        prompt:
          "Write your response. Acknowledge the concern, clarify which fear you are dealing with, and propose a credible next step.",
        rubric: [
          "empathy",
          "problemDiscovery",
          "relevance",
          "persuasion",
          "nextStep",
          "technicalAccuracy",
        ],
        contextKeywords: [
          "headcount",
          "engineers",
          "cooperate",
          "team",
          "resist",
          "jobs",
        ],
        modelAnswer:
          "That is a fair concern, and if the team believes it, nothing else matters. Can I ask which part worries you more: how your engineers would react, or how this would be read further up as a headcount decision? The teams that get value tend to point it at work engineers were never going to get to — the tedious migration, the manual release checks — and keep engineers reviewing and directing. If it is useful, I would rather your most skeptical engineer picks the first task and judges the pull request themselves than have me convince anyone.",
        nextBestQuestion:
          "Who would be your most skeptical reviewer, and what would they need to see to change their mind?",
        meddicccFocus: ["champion", "identifyPain"],
      },
    ],
  },
];

export function getQuiz(id: string): Quiz | undefined {
  return quizzes.find((q) => q.id === id);
}
