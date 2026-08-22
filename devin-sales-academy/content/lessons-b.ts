import type { Lesson } from "@/lib/types";

export const moduleBLessons: Lesson[] = [
  {
    id: "b-repo-work",
    module: "B",
    title: "How Devin works with a repository",
    skills: ["technicalFluency", "demos"],
    definition:
      "Devin works inside a repository (the project's shared codebase): it reads the existing code, makes a branch (a separate workspace for changes), implements a change, and opens a pull request (a proposed code change submitted for review).",
    whyCtoCares:
      "It means Devin fits the workflow the team already has, rather than asking them to adopt a new one.",
    devinConnection:
      "This is the core loop every other capability sits on top of. If you can describe it accurately, most 'how does it actually work' questions become easy.",
    example:
      "Given a ticket, Devin reads the relevant files, follows the patterns it finds, makes the change, runs the tests, and opens a pull request describing what it did.",
    misconception:
      "That Devin generates code in a vacuum. It works against the specific codebase, its conventions, and its checks.",
    knowledgeCheck: {
      question: "What does Devin produce at the end of a normal task?",
      options: [
        "A deployed change in production",
        "A reviewable pull request on a branch",
        "A document describing what should be done",
        "A direct edit to the live application",
      ],
      answerIndex: 1,
      explanation:
        "The reviewable pull request is the answer to most control and trust questions.",
    },
    customerQuestion:
      "Walk me through what happens today between a ticket being written and the change being merged.",
    questionImplication:
      "You can then map Devin's loop onto their existing steps instead of describing it abstractly.",
    businessImpact:
      "Speed with retained control: work arrives in the format their process already knows how to inspect.",
  },
  {
    id: "b-planning",
    module: "B",
    title: "Planning before implementation",
    skills: ["technicalFluency", "demos"],
    definition:
      "Devin can state a plan in plain English — what it will change, which files, what could break, and how it will verify — before writing code.",
    whyCtoCares:
      "Reviewing a paragraph is far cheaper than reviewing a wrong change. Planning catches misunderstanding early.",
    devinConnection:
      "This is also the single best habit to teach a customer: ask for a plan first and approve it.",
    example:
      "'I'll add the discount rule in pricing.ts following the existing tax-rule pattern, add two tests, and run the suite. Risk: the legacy coupon path also reads this config.'",
    misconception:
      "That planning slows things down. It usually saves a whole cycle of rework.",
    knowledgeCheck: {
      question: "Why is a plan-first workflow persuasive to a cautious buyer?",
      options: [
        "It removes the need for tests",
        "It gives a human a cheap intervention point before any code exists",
        "It makes Devin faster",
        "It guarantees correctness",
      ],
      answerIndex: 1,
      explanation:
        "Cheap, early intervention points are exactly what risk-averse leaders want.",
    },
    customerQuestion:
      "How do you currently catch a misunderstanding about scope before an engineer has spent a week on it?",
    questionImplication:
      "You expose rework cost, which is usually invisible in their metrics but painful in their experience.",
    businessImpact:
      "Cost: rework avoided is the cheapest productivity gain available.",
  },
  {
    id: "b-patterns",
    module: "B",
    title: "Finding and following existing patterns",
    skills: ["technicalFluency", "demos"],
    definition:
      "Devin looks for an existing file that does something similar and follows its conventions, structure, and test style.",
    whyCtoCares:
      "Consistency is what keeps a codebase reviewable as it grows. Inconsistent contributions create long-term drag.",
    devinConnection:
      "You can ask Devin which file it used as its reference, which makes the consistency claim checkable rather than rhetorical.",
    example:
      "Adding a new endpoint by mirroring the structure, error handling, and tests of the endpoint next to it.",
    misconception:
      "That an AI will impose its own style. Following repo patterns is an instruction the customer controls.",
    knowledgeCheck: {
      question: "How can a customer verify the 'follows our patterns' claim?",
      options: [
        "Trust the vendor",
        "Ask which existing file was used as the reference and compare",
        "Run more tests",
        "Read the marketing site",
      ],
      answerIndex: 1,
      explanation:
        "Offering a verification method is more persuasive than repeating the claim.",
    },
    customerQuestion:
      "How consistent are contributions across your teams today, and what happens when someone does it their own way?",
    questionImplication:
      "You surface the review burden created by inconsistency, which is a problem Devin can be pointed at directly.",
    businessImpact:
      "Cost and speed: consistent code is faster to review and cheaper to maintain.",
  },
  {
    id: "b-implementation",
    module: "B",
    title: "Implementing changes",
    skills: ["technicalFluency", "demos"],
    definition:
      "Devin makes the code change itself: editing files, adding tests, and iterating until the checks pass.",
    whyCtoCares:
      "This is where capacity is actually recovered — but only for work that is well-specified enough to hand off.",
    devinConnection:
      "Good first scopes are bounded and verifiable: a described bug, a repetitive migration, a small feature with clear acceptance criteria.",
    example:
      "A ticket saying 'invoices for EU customers round to the wrong decimal; expected behaviour is X' is a clean handoff.",
    misconception:
      "That vague work can be handed off. Ambiguity produces the same problems it does with a new human engineer.",
    knowledgeCheck: {
      question: "Which task is the best first candidate?",
      options: [
        "Re-architecting the payments platform",
        "A well-described bug with clear expected behaviour",
        "Deciding the product roadmap",
        "A change to authentication logic on day one",
      ],
      answerIndex: 1,
      explanation:
        "Bounded and verifiable beats large and ambitious for a first project, and proposing it builds trust.",
    },
    customerQuestion:
      "What kind of work sits in your backlog for months because it is well understood but nobody has time for it?",
    questionImplication:
      "This question finds work that is both valuable and safe, which is exactly what a first project needs to be.",
    businessImpact:
      "Speed: backlog items that never start have an ongoing opportunity cost.",
  },
  {
    id: "b-tests-lint",
    module: "B",
    title: "Running tests and linting",
    skills: ["technicalFluency", "demos"],
    definition:
      "Devin runs the repository's existing tests and linter and shows the output as part of its work.",
    whyCtoCares:
      "It converts 'the AI says it works' into evidence the team's own checks produced.",
    devinConnection:
      "It also matters that Devin should fix the code rather than weaken a failing test — that is the difference between real and fake green.",
    example:
      "The pull request shows the test suite passing and the lint run clean, plus the two tests that were added.",
    misconception:
      "That green checks prove correctness. They prove the checks the team wrote still pass.",
    knowledgeCheck: {
      question: "If a test fails, what is the correct behaviour?",
      options: [
        "Delete or weaken the test",
        "Fix the code, or stop and explain why the test itself looks wrong",
        "Skip the test suite",
        "Merge anyway with a note",
      ],
      answerIndex: 1,
      explanation:
        "Never modifying tests to make them pass is a standard the customer can and should enforce.",
    },
    customerQuestion:
      "What evidence does your team need attached to a change before they are comfortable merging it?",
    questionImplication:
      "You learn their trust criteria, which lets you shape a proof of value they will actually accept.",
    businessImpact:
      "Risk: evidence-based review is what keeps quality flat while throughput increases.",
  },
  {
    id: "b-browser-testing",
    module: "B",
    title: "Testing applications through a browser",
    skills: ["technicalFluency", "demos"],
    definition:
      "Devin can run the application and use it in a browser — clicking through a flow — and record what it did.",
    whyCtoCares:
      "Manual verification is often the slowest, least-loved part of the release process.",
    devinConnection:
      "This is the strongest answer to a manual-QA bottleneck, because the recording is evidence a non-engineer can watch.",
    example:
      "After changing the signup form, Devin runs the app, completes a signup, and records the flow working.",
    misconception:
      "That this replaces a QA function. It automates specific verification passes; it does not replace exploratory testing judgement.",
    knowledgeCheck: {
      question: "What does a browser recording prove?",
      options: [
        "That the whole application is bug-free",
        "That the specific flow shown behaves as demonstrated",
        "That performance is acceptable at scale",
        "That the code is well designed",
      ],
      answerIndex: 1,
      explanation:
        "Stating narrow, true claims about evidence is how you stay credible.",
    },
    customerQuestion:
      "How much manual clicking happens before a release today, and who does it?",
    questionImplication:
      "You quantify a repetitive labour cost and identify the person whose life gets better, a likely champion.",
    businessImpact:
      "Speed and cost: manual verification directly delays releases and consumes skilled time.",
  },
  {
    id: "b-reviewable-changes",
    module: "B",
    title: "Producing reviewable changes",
    skills: ["technicalFluency", "empathy"],
    definition:
      "Devin aims to produce small, scoped changes with a written description rather than sprawling rewrites.",
    whyCtoCares:
      "Large changes get rubber-stamped, which is how defects reach production. Small changes get real review.",
    devinConnection:
      "'Keep it minimal, do not refactor unrelated code' is an instruction the customer can set once and rely on.",
    example:
      "A 60-line pull request touching three files, with the reasoning and the risk stated up front.",
    misconception:
      "That more output is better. Reviewable output is better.",
    knowledgeCheck: {
      question: "Why does change size matter for trust?",
      options: [
        "Small changes run faster",
        "Reviewers can actually understand small changes, so oversight stays real",
        "Small changes need no tests",
        "Large changes cannot be merged",
      ],
      answerIndex: 1,
      explanation:
        "Oversight that is theoretically present but practically impossible is the thing engineers fear.",
    },
    customerQuestion:
      "How big is a typical pull request on your team, and how thoroughly do reviewers get through them?",
    questionImplication:
      "You raise a quality issue they already feel, without criticizing their team.",
    businessImpact:
      "Risk: review quality, not review existence, is what prevents defects.",
  },
  {
    id: "b-explaining-diffs",
    module: "B",
    title: "Explaining diffs and risks",
    skills: ["technicalFluency", "empathy"],
    definition:
      "Devin can explain what changed, what behaviour is now different, what risk the change carries, and what to click to check it.",
    whyCtoCares:
      "It lets non-authors — including non-engineers — understand the change and the residual risk.",
    devinConnection:
      "Ask for 'the riskiest part of this change and what you decided not to do' — the answer is often the most useful sentence in the review.",
    example:
      "'Behaviour change: EU invoices now round to two decimals. Risk: the legacy coupon path shares this helper. Not done: the reporting export still uses the old rule.'",
    misconception:
      "That an explanation is marketing fluff. It is the artefact that makes delegation supervisable.",
    knowledgeCheck: {
      question: "Which follow-up question extracts the most value from a change explanation?",
      options: [
        "How many lines did you change?",
        "What is the riskiest part of this change, and what did you decide not to do?",
        "How long did it take?",
        "Which model wrote this?",
      ],
      answerIndex: 1,
      explanation:
        "Risk plus deliberate omissions is where the real review signal lives.",
    },
    customerQuestion:
      "When a change is proposed today, how do non-authors find out what the risk actually is?",
    questionImplication:
      "You surface a communication gap that is felt by managers and product people, widening your stakeholder base.",
    businessImpact:
      "Risk: better-understood changes mean fewer surprises after release.",
  },
  {
    id: "b-self-review",
    module: "B",
    title: "Self-review and iteration",
    skills: ["technicalFluency", "demos"],
    definition:
      "Devin can review its own work critically — flagging anything hacky, hardcoded, or untested — and then fix the real problems before a human looks.",
    whyCtoCares:
      "It raises the floor on what arrives for review, so human attention goes to judgement rather than obvious cleanup.",
    devinConnection:
      "Automatic review of pull requests and fixing of review comments and pipeline failures can be enabled in settings, which reduces the babysitting burden.",
    example:
      "Devin notices it hardcoded a currency code, replaces it with the existing config lookup, and reruns the tests.",
    misconception:
      "That self-review replaces human review. It reduces obvious problems; it does not confer independent judgement.",
    knowledgeCheck: {
      question: "The honest claim about self-review is:",
      options: [
        "It makes human review unnecessary",
        "It raises the quality of what arrives, so human review is spent on judgement",
        "It guarantees production safety",
        "It replaces the pipeline",
      ],
      answerIndex: 1,
      explanation:
        "Sell the shift in where human attention goes, not the removal of humans.",
    },
    customerQuestion:
      "What kinds of comments do your reviewers find themselves repeating over and over?",
    questionImplication:
      "Repeated review comments are a perfect candidate for a knowledge note, which is a concrete, low-risk first win.",
    businessImpact:
      "Cost: repeated mechanical review comments are recoverable senior-engineer time.",
  },
  {
    id: "b-knowledge-notes",
    module: "B",
    title: "Knowledge notes",
    skills: ["technicalFluency", "demos"],
    definition:
      "A knowledge note is a persistent instruction or lesson that Devin applies in future sessions, so a correction only has to be made once.",
    whyCtoCares:
      "It is how the team's standards get encoded rather than re-explained, and it compounds over time.",
    devinConnection:
      "Whenever a customer corrects Devin, the follow-up is 'save that as a knowledge note so it always works this way'.",
    example:
      "'Always run the integration suite before opening a pull request in this repo' becomes a note, not a reminder.",
    misconception:
      "That this is generic AI memory. These are reviewable, editable instructions the customer approves and owns.",
    knowledgeCheck: {
      question: "What is the business value of knowledge notes?",
      options: [
        "They make the model smarter in general",
        "The team's standards get applied consistently without being re-explained",
        "They remove the need for documentation",
        "They speed up the build",
      ],
      answerIndex: 1,
      explanation:
        "Compounding consistency is the value, and it is a strong second-meeting story.",
    },
    customerQuestion:
      "Where do your engineering standards live today, and how reliably do they actually get followed?",
    questionImplication:
      "Standards that live in people's heads are a governance gap, which makes persistent instructions genuinely valuable rather than a nice-to-have.",
    businessImpact:
      "Cost and risk: consistent standards reduce rework and review friction as headcount changes.",
  },
  {
    id: "b-playbooks",
    module: "B",
    title: "Playbooks",
    skills: ["technicalFluency", "demos"],
    definition:
      "A playbook is a repeatable workflow saved once and run again later with one click.",
    whyCtoCares:
      "Repeated operational work is where predictable, measurable capacity is recovered.",
    devinConnection:
      "Any time a customer describes doing the same sequence monthly — dependency upgrades, report generation, routine migrations — that is a playbook candidate.",
    example:
      "A monthly dependency-upgrade routine becomes a playbook that runs the same way every time.",
    misconception:
      "That playbooks are automation scripts. They are described workflows, so they tolerate the small variations scripts break on.",
    knowledgeCheck: {
      question: "Which is the best playbook candidate?",
      options: [
        "A one-off architectural decision",
        "A recurring routine the team performs the same way each month",
        "Hiring interviews",
        "A brand-new product feature",
      ],
      answerIndex: 1,
      explanation:
        "Recurrence is the qualifying signal, and recurrence also makes savings easy to quantify.",
    },
    customerQuestion:
      "What does your team do every month or every release that follows more or less the same steps?",
    questionImplication:
      "Recurring work gives you a frequency you can multiply into an annual number for the economic buyer.",
    businessImpact:
      "Cost: recurring toil has an annualized price that is easy to put in a business case.",
  },
  {
    id: "b-environment-blueprints",
    module: "B",
    title: "Environment setup and blueprints",
    skills: ["technicalFluency", "demos"],
    definition:
      "A blueprint captures how to set a repository up — install dependencies, build, run tests, start the app — so future sessions begin ready to work.",
    whyCtoCares:
      "Without it, an agent (like a new hire) spends its time guessing at setup instead of verifying its work.",
    devinConnection:
      "Setting this up once is the highest-leverage first step in any pilot; quality jumps once verification is possible.",
    example:
      "The blueprint installs dependencies and starts the test database, so every later session can run the suite immediately.",
    misconception:
      "That environment setup is a footnote. It is usually the difference between a useful pilot and a disappointing one.",
    knowledgeCheck: {
      question: "Why insist on environment setup before a pilot is judged?",
      options: [
        "It reduces licence cost",
        "Without a working environment, work cannot be verified, so quality looks worse than it is",
        "It is required for security review",
        "It speeds up the browser",
      ],
      answerIndex: 1,
      explanation:
        "Framing setup as a prerequisite protects the pilot from an unfair evaluation.",
    },
    customerQuestion:
      "How long does it take a new engineer to get your project running locally and pass the tests?",
    questionImplication:
      "Onboarding time is a metric they usually know and dislike, and it points at a concrete first task.",
    businessImpact:
      "Speed: onboarding and verification friction slows every new contributor, human or not.",
  },
  {
    id: "b-oversight-limits",
    module: "B",
    title: "Human oversight and when Devin is not the answer",
    skills: ["technicalFluency", "empathy", "objections"],
    definition:
      "Devin is suited to bounded, verifiable engineering work under human review. It is not the right tool for everything.",
    whyCtoCares:
      "A vendor who names the limits is easier to trust than one who claims none.",
    devinConnection:
      "Poor fits include: irreversible data operations without careful review, decisions requiring product or business judgement, work with no clear acceptance criteria, and highly sensitive areas the customer wants humans on. Say so plainly.",
    example:
      "'I would not point a first project at your authentication logic. I would pick the invoice-rounding bug.'",
    misconception:
      "That naming limits weakens the pitch. It is usually what converts a skeptical engineer into a champion.",
    knowledgeCheck: {
      question: "A senior developer says 'this will not work on our complex codebase.' The best reply:",
      options: [
        "'Devin handles any codebase.'",
        "'Which part would you least trust it on? I would rather start somewhere bounded and let you judge the result.'",
        "'Complexity is not a problem for AI.'",
        "'Your codebase is probably not that complex.'",
      ],
      answerIndex: 1,
      explanation:
        "Inviting their judgement and proposing a bounded test respects their expertise and keeps the conversation alive.",
    },
    customerQuestion:
      "Where would you not want an agent working, at least to begin with?",
    questionImplication:
      "You get their real boundaries, and asking first makes you the person who scoped it responsibly.",
    businessImpact:
      "Risk: correctly scoped adoption avoids the failed-pilot story that blocks tools for years.",
  },
];
