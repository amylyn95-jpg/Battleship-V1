import type { DemoRecipe } from "@/lib/types";

export const demoRecipes: DemoRecipe[] = [
  {
    id: "demo-slow-implementation",
    pain: "Slow implementation — work sits in the backlog because nobody has capacity to start it",
    painKeywords: [
      "slow",
      "backlog",
      "capacity",
      "postponed",
      "never get to",
      "behind",
      "commitment",
      "roadmap",
      "hiring",
      "freeze",
      "throughput",
    ],
    demo:
      "Devin reads the repository, plans a small described change, implements it, and opens a pull request",
    proves: "Workflow coverage and developer leverage on well-specified work",
    setup: [
      "A repository Devin already has an environment set up for",
      "One bounded, well-described ticket with clear expected behaviour",
      "Agreement that you will review the plan before any code is written",
    ],
    steps: [
      "Show the ticket, then ask for a plain-English plan: what will change, which files, what could break, how it will be verified",
      "Approve the plan out loud so the customer sees the human decision point",
      "Let Devin implement, showing that it references an existing similar file for patterns",
      "Open the pull request and read the description together — behaviour change, risk, what was deliberately not done",
    ],
    narration:
      "The point here is not speed. It is that you get an intervention point before any code exists, and then a change small enough that your reviewer can actually judge it.",
    doesNotProve: [
      "That it would handle an ambiguous or poorly specified ticket",
      "That it would handle your most complex subsystem",
      "Anything about production safety — merging and deploying remain in your process",
    ],
    likelyObjections: [
      "That ticket was easy",
      "Our tickets are never that well specified",
      "Reviewing this still costs my senior engineer time",
    ],
    followUpQuestion:
      "How many of your backlog items are specified about this well, and how many would need a human to sharpen them first?",
  },
  {
    id: "demo-low-confidence",
    pain: "Low confidence in AI-generated changes",
    painKeywords: [
      "trust",
      "confidence",
      "quality",
      "hacky",
      "subtly wrong",
      "review burden",
      "hardcoded",
      "skeptical",
      "verify",
    ],
    demo:
      "Devin runs the existing tests, explains the diff, and reviews its own work before a human sees it",
    proves: "Reviewability and verification — that evidence arrives attached to the change",
    setup: [
      "A repository with a working test suite and linter",
      "A change that touches logic with real test coverage",
      "The customer's most skeptical engineer in the room",
    ],
    steps: [
      "Run the existing test suite and linter and show the raw output, not a summary",
      "Ask Devin to explain the diff in plain English: what behaviour changed and what risk it carries",
      "Ask Devin to review its own work as a skeptical senior engineer and fix anything hacky, hardcoded, or untested",
      "Ask the killer question: what is the riskiest part of this change, and what did you decide not to do?",
    ],
    narration:
      "I am not asking you to trust the tool. I am asking whether the evidence attached to this change is the evidence your reviewers would want.",
    doesNotProve: [
      "That the tests cover everything that matters — they only cover what someone wrote",
      "That the change is well designed for the long term",
      "That it will behave this way on an area with no test coverage",
    ],
    likelyObjections: [
      "Passing tests do not mean it is correct",
      "Our coverage is poor in exactly the risky areas",
      "It would just weaken a test to make it pass",
    ],
    followUpQuestion:
      "Which parts of your codebase have coverage weak enough that you would want a human writing the tests first?",
  },
  {
    id: "demo-repetitive-maintenance",
    pain: "Repetitive maintenance and toil consuming senior time",
    painKeywords: [
      "repetitive",
      "toil",
      "maintenance",
      "upgrade",
      "dependency",
      "tedious",
      "boring",
      "cleanup",
      "monthly",
      "flaky",
      "migration",
    ],
    demo: "Devin handles a bounded maintenance task end to end",
    proves: "Potential capacity recovery on work engineers actively avoid",
    setup: [
      "A real maintenance item the team has postponed — a mechanical cleanup or dependency round",
      "The person who normally does it, watching",
      "An agreed definition of done",
    ],
    steps: [
      "Show the scope: how many files, how mechanical, how long it normally takes",
      "Have Devin do one representative slice first and get it reviewed before the rest",
      "Run the full suite and show the output",
      "Open the pull request, keeping the change scoped — no unrelated refactoring or reformatting",
    ],
    narration:
      "This is the work that never wins a prioritization argument. It is also where the hours actually are — and the person who normally does it can tell you whether the output is right.",
    doesNotProve: [
      "That it handles judgement-heavy design work",
      "That it would be safe on irreversible data operations",
      "That the same approach scales to a whole platform migration unsupervised",
    ],
    likelyObjections: [
      "We could script that",
      "The last 30% always varies and breaks automation",
      "Reviewing forty files is its own burden",
    ],
    followUpQuestion:
      "How many days a month does this class of work take today, and who would get those days back?",
  },
  {
    id: "demo-onboarding",
    pain: "Onboarding difficulty and knowledge concentrated in a few people",
    painKeywords: [
      "onboard",
      "onboarding",
      "new hire",
      "ramp",
      "documentation",
      "knowledge",
      "key person",
      "legacy",
      "only person",
      "understand",
      "bus factor",
    ],
    demo: "Devin explains how an unfamiliar part of the codebase works, in plain English with a diagram",
    proves: "Faster system understanding and reduced dependence on one expert",
    setup: [
      "A genuinely gnarly service the team considers hard to understand",
      "A new engineer and, ideally, the one expert to check the answer",
    ],
    steps: [
      "Ask for a plain-English explanation of how the service works, with a diagram",
      "Have the resident expert correct anything wrong",
      "Save the correction as a knowledge note so the explanation improves permanently",
      "Ask a follow-up a new hire would actually ask, such as where a specific behaviour is implemented",
    ],
    narration:
      "The value here is not that it replaces your expert. It is that the fifth person asking the same question does not have to interrupt him.",
    doesNotProve: [
      "That the explanation is complete or authoritative without expert review",
      "That undocumented business intent can be recovered from code",
      "Anything about code-change quality",
    ],
    likelyObjections: [
      "It could be confidently wrong",
      "We should just write documentation",
      "Only Tomas can validate this anyway",
    ],
    followUpQuestion:
      "How many hours a week does your expert spend answering questions that a good explanation would have covered?",
  },
  {
    id: "demo-inconsistent-practices",
    pain: "Inconsistent engineering practices across teams",
    painKeywords: [
      "inconsistent",
      "consistency",
      "standards",
      "patterns",
      "conventions",
      "style",
      "different",
      "drift",
      "quality varies",
    ],
    demo: "Devin follows an existing repository pattern and names the file it used as a reference",
    proves: "Consistency without a written style guide nobody reads",
    setup: [
      "A repo with a clear existing pattern — for example a set of similar endpoints or handlers",
      "A change that should follow that pattern",
    ],
    steps: [
      "Ask Devin to find an existing file that does something similar and follow its patterns and test style",
      "Ask it to state which file it used as the reference",
      "Compare the new code with the reference file side by side",
      "Turn one of the customer's recurring review comments into a knowledge note and show it applied next time",
    ],
    narration:
      "The checkable part is that it tells you which file it copied its conventions from — so consistency is something you verify, not something I claim.",
    doesNotProve: [
      "That it will choose the right pattern when the repo contains several competing ones",
      "That it can decide which of your conventions should win",
    ],
    likelyObjections: [
      "We have three competing patterns and no agreement on which is right",
      "Following a bad existing pattern is not an improvement",
    ],
    followUpQuestion:
      "Which review comments do your reviewers find themselves repeating most often? Those are the first knowledge notes.",
  },
  {
    id: "demo-manual-qa",
    pain: "Manual QA bottleneck before every release",
    painKeywords: [
      "qa",
      "manual",
      "testing",
      "clicking",
      "regression",
      "release",
      "verify",
      "smoke test",
      "before release",
      "bottleneck",
    ],
    demo: "Devin runs the application and tests a flow through a browser, and records it",
    proves: "End-to-end verification of specific flows, with evidence a non-engineer can watch",
    setup: [
      "A running application environment",
      "The two or three flows that must always work before a release",
      "The person who currently does the manual pass",
    ],
    steps: [
      "Pick a flow the customer checks manually every release",
      "Have Devin run the app and complete the flow in a browser while recording",
      "Watch the recording together, including the assertions at each step",
      "Discuss which flows are worth automating this way and which still need human judgement",
    ],
    narration:
      "This does not replace exploratory testing. It removes the part of your release that is the same every fortnight and that nobody enjoys.",
    doesNotProve: [
      "That the whole application is working — only the flows demonstrated",
      "Anything about performance under load",
      "That exploratory or usability testing can be automated",
    ],
    likelyObjections: [
      "Our flows need real payment data",
      "We would still do a manual pass anyway",
      "Test environments never match production",
    ],
    followUpQuestion:
      "How many hours does the manual pass take per release, how often do you release, and what does the delay push out?",
  },
  {
    id: "demo-repeated-operational-work",
    pain: "Repeated operational work with the same steps each time",
    painKeywords: [
      "recurring",
      "every month",
      "every release",
      "routine",
      "same steps",
      "operational",
      "report",
      "playbook",
      "repeatable",
      "again",
    ],
    demo: "Convert the workflow into a playbook and run it again",
    proves: "Repeatability — the second run costs almost nothing to set up",
    setup: [
      "A workflow the customer performs on a schedule",
      "One successful manual run to base the playbook on",
    ],
    steps: [
      "Do the workflow once with Devin, capturing the steps as you go",
      "Save it as a playbook",
      "Run the playbook again on a different input and compare the output",
      "Show how a correction becomes part of the playbook rather than a reminder",
    ],
    narration:
      "The interesting part is not the first run, it is the second one — that is where the recurring hours actually come back.",
    doesNotProve: [
      "That workflows with genuinely unpredictable variation can be fully automated",
      "That no human review is needed on subsequent runs",
    ],
    likelyObjections: [
      "Ours varies too much each month",
      "We already scripted the easy 70%",
    ],
    followUpQuestion:
      "How many times a year do you run this, and how many hours is each run?",
  },
  {
    id: "demo-session-corrections",
    pain: "Corrections and standards have to be re-explained constantly",
    painKeywords: [
      "repeat",
      "re-explain",
      "correction",
      "standards",
      "convention",
      "remind",
      "same comment",
      "knowledge",
      "documented",
      "tribal",
    ],
    demo: "Save an instruction as a knowledge note and show it applied in the next session",
    proves: "Persistent learning — a correction only has to be made once",
    setup: [
      "One recurring review comment or standard the team repeats",
      "Two sessions, so the second can demonstrate the note being applied",
    ],
    steps: [
      "Make the correction in the moment, as a reviewer would",
      "Save it as a knowledge note, showing that the customer approves and owns the wording",
      "Start a fresh task and show the note being followed without being restated",
      "Ask which of their standards would be worth encoding this way",
    ],
    narration:
      "This is the compounding part. Over a few weeks the setup encodes your standards, which is what stops teams giving up on tooling after the first frustration.",
    doesNotProve: [
      "That every standard can be usefully expressed as a note",
      "That notes remove the need for human review",
    ],
    likelyObjections: [
      "Our standards are not written down anywhere",
      "Different teams disagree about the standard",
    ],
    followUpQuestion:
      "Where do your engineering standards live today, and how reliably do they get followed?",
  },
];
