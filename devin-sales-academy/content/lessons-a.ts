import type { Lesson } from "@/lib/types";

export const moduleALessons: Lesson[] = [
  {
    id: "a-source-code",
    module: "A",
    title: "Source code",
    skills: ["technicalFluency"],
    definition:
      "Source code is the set of written instructions that makes software work. Engineers read and change it the way a lawyer reads and edits a contract.",
    whyCtoCares:
      "Source code is the company's most valuable and most fragile asset. Every change to it is a change to the product customers touch.",
    devinConnection:
      "Devin reads the existing source code in a repository (the project's shared codebase) before it changes anything, so its work matches how that codebase already does things.",
    example:
      "A checkout button that applies a discount exists because someone wrote a few lines of source code describing when the discount applies.",
    misconception:
      "That code is written once and finished. Most engineering time is spent changing code that already exists, not writing brand-new code.",
    knowledgeCheck: {
      question: "Which is the best plain-English description of source code?",
      options: [
        "The database where customer records live",
        "The written instructions that make the software behave the way it does",
        "The design mockups a designer produces",
        "The servers the application runs on",
      ],
      answerIndex: 1,
      explanation:
        "Source code is the instructions themselves. Databases, designs, and servers are separate things the code uses or runs on.",
    },
    customerQuestion:
      "When your team needs to change how something behaves for a customer, what does that process look like today from request to live?",
    questionImplication:
      "You learn their real delivery workflow instead of guessing, and you get the raw material for every later Implication question.",
    businessImpact:
      "Speed: how quickly a team can safely change source code sets the ceiling on how fast the business can ship anything.",
  },
  {
    id: "a-repository",
    module: "A",
    title: "Repository",
    skills: ["technicalFluency"],
    definition:
      "A repository (the project's shared codebase, often shortened to 'repo') is where all the source code for a project lives, along with its full history of changes.",
    whyCtoCares:
      "The repo is the single source of truth. Access to it is a security decision, and its structure explains why some teams move fast and others do not.",
    devinConnection:
      "Devin works inside a repository the same way an engineer does: it clones it, reads it, makes a branch, and proposes changes for review.",
    example:
      "A company might have one repo for its mobile app, one for its website, and one for the internal billing service.",
    misconception:
      "That a repo is just a folder of files. It is really a versioned history, which is why you can see who changed what, when, and why.",
    knowledgeCheck: {
      question: "Why does a repository's history matter to a buyer?",
      options: [
        "It makes the code run faster",
        "It provides an auditable record of every change and who made it",
        "It replaces the need for tests",
        "It stores customer data",
      ],
      answerIndex: 1,
      explanation:
        "History gives auditability and the ability to revert, which is exactly what risk-averse buyers care about.",
    },
    customerQuestion:
      "How many repositories does your team work across, and which ones cause the most pain to change?",
    questionImplication:
      "You find where the friction concentrates, which tells you where a bounded first project would land.",
    businessImpact:
      "Risk: a well-kept repository history is what lets a team investigate and undo a bad change quickly.",
  },
  {
    id: "a-branch",
    module: "A",
    title: "Branch",
    skills: ["technicalFluency"],
    definition:
      "A branch is a separate workspace for changes. Work happens on the branch, so the live version of the code is untouched until the change is approved.",
    whyCtoCares:
      "Branches are how teams take risk safely. Nothing an engineer (or an agent) does on a branch can affect customers until someone merges it.",
    devinConnection:
      "Devin does its work on its own branch, which means its changes are inspectable and reversible before they ever reach production.",
    example:
      "An engineer creates a branch to try a new pricing page. If the idea is dropped, the branch is simply deleted.",
    misconception:
      "That an AI making code changes means changes going live automatically. Branch-based work means a human still decides what merges.",
    knowledgeCheck: {
      question: "A change on a branch that has not been merged is:",
      options: [
        "Already affecting customers",
        "Isolated from the live product until someone approves and merges it",
        "Impossible to review",
        "Permanently discarded",
      ],
      answerIndex: 1,
      explanation:
        "Branch isolation is the reason review-based workflows are safe, and it is the single most useful concept for calming an anxious buyer.",
    },
    customerQuestion:
      "Who decides what gets merged into your main codebase today, and how long does that decision usually take?",
    questionImplication:
      "You learn both the approval workflow and where the bottleneck is, which often turns out to be review capacity rather than writing code.",
    businessImpact:
      "Risk and speed: branches let teams work in parallel without stepping on each other or on customers.",
  },
  {
    id: "a-commit",
    module: "A",
    title: "Commit",
    skills: ["technicalFluency"],
    definition:
      "A commit is a saved set of code changes with a short message explaining the intent.",
    whyCtoCares:
      "Commits are the unit of traceability. Clear commits make incidents faster to diagnose and audits easier to pass.",
    devinConnection:
      "Devin's work arrives as commits on a branch, so a reviewer can read the change step by step rather than as one opaque blob.",
    example:
      "'Fix tax rounding on invoices for EU customers' is a commit message describing one saved change.",
    misconception:
      "That a commit is a deployment. A commit only saves the change; deploying it is a separate step.",
    knowledgeCheck: {
      question: "What does a commit represent?",
      options: [
        "A saved set of changes with an explanation of intent",
        "A release to customers",
        "A meeting decision",
        "A test result",
      ],
      answerIndex: 0,
      explanation:
        "Commit, merge, and deploy are three different steps. Keeping them straight makes you credible with engineers.",
    },
    customerQuestion:
      "When something breaks in production, how do you currently trace it back to the change that caused it?",
    questionImplication:
      "This uncovers incident and debugging cost, which is usually an unmeasured but painful expense.",
    businessImpact:
      "Cost: poor traceability turns a ten-minute fix into a multi-hour investigation involving several engineers.",
  },
  {
    id: "a-pull-request",
    module: "A",
    title: "Pull request",
    skills: ["technicalFluency"],
    definition:
      "A pull request (a proposed code change submitted for review) is how one engineer asks the team to review and accept their work.",
    whyCtoCares:
      "The pull request is the control point. It is where quality, security, and standards get enforced by humans.",
    devinConnection:
      "Devin's output is a pull request: a described, reviewable change with the reasoning and verification attached, not a black box.",
    example:
      "A pull request titled 'Add rollback button to the admin panel' shows exactly which lines changed and why.",
    misconception:
      "That reviewing an AI-written pull request is fundamentally different from reviewing a colleague's. The review workflow is the same.",
    knowledgeCheck: {
      question: "Why is a pull request the most important concept for selling Devin?",
      options: [
        "It removes the need for engineers",
        "It is where human oversight happens, which addresses the buyer's control concerns",
        "It makes code faster",
        "It stores customer data securely",
      ],
      answerIndex: 1,
      explanation:
        "Almost every trust objection is really a question about oversight, and the pull request is the concrete answer.",
    },
    customerQuestion:
      "How long does a typical pull request wait for review, and what happens to the engineer while they wait?",
    questionImplication:
      "Review latency is a measurable metric and often the real constraint, which sets up a strong Implication question.",
    businessImpact:
      "Speed: a change that is written in two hours but waits three days for review has a delivery problem, not a coding problem.",
  },
  {
    id: "a-code-review",
    module: "A",
    title: "Code review",
    skills: ["technicalFluency", "empathy"],
    definition:
      "Code review is the practice of another engineer checking a proposed change before it is merged.",
    whyCtoCares:
      "Review protects quality and shares knowledge, but it also consumes senior engineers' scarcest hours.",
    devinConnection:
      "Devin can produce smaller, well-explained changes and review its own work first, which makes human review faster — it does not remove the human reviewer.",
    example:
      "A senior engineer comments 'this will break for customers without a billing address' before the change merges.",
    misconception:
      "That more review always means more quality. Very large changes get worse review, which is why small pull requests matter.",
    knowledgeCheck: {
      question: "Which statement is safe to make to a skeptical engineer?",
      options: [
        "Devin removes the need for code review",
        "Devin aims to make review easier by producing smaller, explained, tested changes",
        "Devin's changes never need review",
        "Devin reviews code better than humans",
      ],
      answerIndex: 1,
      explanation:
        "Claiming review is unnecessary destroys credibility instantly. Claiming review gets easier is defensible.",
    },
    customerQuestion:
      "Who does most of the reviewing on your team, and what else would they be doing with that time?",
    questionImplication:
      "You surface the opportunity cost of senior engineers' time, which converts a workflow problem into a financial one.",
    businessImpact:
      "Cost: review time is senior-engineer time, the most expensive capacity in the organization.",
  },
  {
    id: "a-tests",
    module: "A",
    title: "Tests",
    skills: ["technicalFluency"],
    definition:
      "Tests are automated checks that confirm the software still behaves correctly after a change.",
    whyCtoCares:
      "Tests are the difference between shipping confidently and shipping hopefully. Weak tests are why some teams are afraid to change their own code.",
    devinConnection:
      "Devin runs the existing tests and shows the output, so a reviewer sees evidence rather than a promise.",
    example:
      "A test asserts that an expired coupon cannot be applied at checkout. If a change breaks that rule, the test fails.",
    misconception:
      "That passing tests means the change is correct. Tests only check what someone thought to check.",
    knowledgeCheck: {
      question: "What is the honest limit of a passing test suite?",
      options: [
        "It proves the software has no bugs",
        "It proves the behaviors someone wrote tests for still work",
        "It proves the change is well designed",
        "It proves customers will like the change",
      ],
      answerIndex: 1,
      explanation:
        "Being precise about what evidence does and does not prove is what makes a seller credible with technical buyers.",
    },
    customerQuestion:
      "How much of your codebase is covered by automated tests, and where do you still rely on manual checking?",
    questionImplication:
      "Manual checking is a labour cost and a release-speed constraint, and it points directly at a browser-testing demo.",
    businessImpact:
      "Risk and speed: good tests let a team ship small changes many times a day instead of batching risky releases.",
  },
  {
    id: "a-linter",
    module: "A",
    title: "Linter",
    skills: ["technicalFluency"],
    definition:
      "A linter is a tool that automatically flags common code-quality issues and style inconsistencies.",
    whyCtoCares:
      "Linting keeps a codebase consistent without spending human review time on formatting arguments.",
    devinConnection:
      "Devin runs the repo's linter before handing work over, so reviewers spend their attention on logic rather than style.",
    example:
      "A linter flags an unused variable or a missing error check before a human ever reads the change.",
    misconception:
      "That linting is about aesthetics. Many lint rules catch real bugs, like unhandled errors.",
    knowledgeCheck: {
      question: "A linter mainly saves:",
      options: [
        "Server costs",
        "Human review attention on mechanical issues",
        "Customer support tickets",
        "Database space",
      ],
      answerIndex: 1,
      explanation:
        "Automating the mechanical layer of review is a concrete, modest, believable benefit.",
    },
    customerQuestion:
      "How consistent is code quality across your teams today, and how much review time goes to style rather than substance?",
    questionImplication:
      "Inconsistency is a symptom of missing shared standards, which sets up the pattern-following and knowledge-note story.",
    businessImpact:
      "Cost: mechanical review comments are pure waste in a senior engineer's day.",
  },
  {
    id: "a-build",
    module: "A",
    title: "Build",
    skills: ["technicalFluency"],
    definition:
      "A build is the step that turns source code into a runnable application.",
    whyCtoCares:
      "If the build is slow or fragile, every single change gets more expensive, for every engineer, forever.",
    devinConnection:
      "Devin builds the project to confirm the change actually compiles and runs, not just that it looks right.",
    example:
      "A website's build converts many source files into the optimized files a browser downloads.",
    misconception:
      "That a successful build means working software. A build only proves the code assembles, not that it behaves correctly.",
    knowledgeCheck: {
      question: "A green build proves:",
      options: [
        "The application assembles and can run",
        "The feature works as the customer expects",
        "There are no security issues",
        "The tests passed",
      ],
      answerIndex: 0,
      explanation:
        "Build, test, and behave-correctly are three separate claims. Keep them separate when you talk to engineers.",
    },
    customerQuestion:
      "How long does a build take on your main project, and how often is a broken build blocking the team?",
    questionImplication:
      "Build time multiplied by number of engineers is a clean, quantifiable waste metric.",
    businessImpact:
      "Speed and cost: build time is a tax paid on every change by every engineer.",
  },
  {
    id: "a-deployment",
    module: "A",
    title: "Deployment",
    skills: ["technicalFluency"],
    definition:
      "Deployment is the act of putting software somewhere users can actually access it.",
    whyCtoCares:
      "Deployment frequency and failure rate are two of the most widely tracked engineering health metrics.",
    devinConnection:
      "Devin's changes flow through the customer's existing review and deployment process; it does not bypass their release controls.",
    example:
      "A change is merged in the morning and deployed to customers that afternoon by the normal release process.",
    misconception:
      "That an autonomous agent deploys to production on its own. In a review-based workflow, deployment stays where the customer's process puts it.",
    knowledgeCheck: {
      question: "Which is the most accurate statement about Devin and deployment?",
      options: [
        "Devin deploys straight to production automatically",
        "Devin's work goes through the customer's existing review and release process",
        "Devin replaces the deployment pipeline",
        "Devin cannot work with deployed applications",
      ],
      answerIndex: 1,
      explanation:
        "This is the single most reassuring accurate statement you can make about production risk.",
    },
    customerQuestion:
      "How often do you deploy today, and what has to be true before a change is allowed to go out?",
    questionImplication:
      "You learn their release gates, which tells you which stakeholders (security, QA, compliance) must be part of the deal.",
    businessImpact:
      "Speed: deployment frequency is how quickly the business can respond to a customer or competitor.",
  },
  {
    id: "a-ci-cd",
    module: "A",
    title: "CI/CD",
    skills: ["technicalFluency"],
    definition:
      "CI/CD (automated build, test, and deployment workflows) is the pipeline that runs automatically when someone proposes or merges a change.",
    whyCtoCares:
      "CI/CD is the enforcement mechanism for engineering standards. If it is red or slow, quality drifts.",
    devinConnection:
      "Devin watches the pipeline on its own pull requests and fixes failures, which keeps broken pipelines from stalling reviewers.",
    example:
      "Opening a pull request kicks off tests and linting automatically, and the result is shown to reviewers.",
    misconception:
      "That CI/CD is only tooling detail. To a CTO it is the quality gate their entire process depends on.",
    knowledgeCheck: {
      question: "What is CI/CD's role in a review workflow?",
      options: [
        "It writes the code",
        "It automatically builds, tests, and can deploy changes, giving reviewers evidence",
        "It replaces the reviewer",
        "It manages customer support",
      ],
      answerIndex: 1,
      explanation:
        "CI/CD supplies the evidence a reviewer uses; it does not replace judgement.",
    },
    customerQuestion:
      "How much confidence does your pipeline give you today, and how often do failures turn out to be flaky rather than real?",
    questionImplication:
      "Flaky pipelines erode trust in automation generally, which is important context before you propose any autonomous work.",
    businessImpact:
      "Risk and speed: an untrusted pipeline pushes teams back to manual checking and slower releases.",
  },
  {
    id: "a-bug",
    module: "A",
    title: "Bug",
    skills: ["technicalFluency"],
    definition:
      "A bug is unexpected or incorrect behaviour in software.",
    whyCtoCares:
      "Bugs consume unplanned capacity. A team spending half its time on bugs cannot deliver a roadmap.",
    devinConnection:
      "Bounded, well-described bugs are a natural first scope for Devin because the desired behaviour is already agreed.",
    example:
      "Invoices for one country are rounded incorrectly, producing support tickets and refunds.",
    misconception:
      "That bug count is the metric that matters. Time-to-fix and interruption cost usually hurt more.",
    knowledgeCheck: {
      question: "Which framing is most useful in discovery?",
      options: [
        "How many bugs do you have?",
        "What share of your team's week goes to unplanned fixes instead of roadmap work?",
        "Do you like your bug tracker?",
        "How many engineers do you have?",
      ],
      answerIndex: 1,
      explanation:
        "The second question converts a technical annoyance into lost roadmap capacity, which a CFO can understand.",
    },
    customerQuestion:
      "What share of your engineering week currently goes to unplanned fixes rather than planned roadmap work?",
    questionImplication:
      "You get a metric you can revisit later, and you separate symptom (bugs) from consequence (roadmap slippage).",
    businessImpact:
      "Cost and speed: unplanned work is capacity taken directly out of the roadmap.",
  },
  {
    id: "a-technical-debt",
    module: "A",
    title: "Technical debt",
    skills: ["technicalFluency"],
    definition:
      "Technical debt is the accumulation of workarounds and shortcuts that make future changes harder and slower.",
    whyCtoCares:
      "Debt is why a feature that took a week last year takes a month now. It is a silent tax on every estimate.",
    devinConnection:
      "Devin can take on bounded, low-drama debt work (renames, migrations, repetitive cleanups) that teams routinely postpone.",
    example:
      "Two systems store the same customer field differently, so every new feature must handle both.",
    misconception:
      "That debt is the same as bad code. It is often a reasonable past decision that has outlived its context.",
    knowledgeCheck: {
      question: "The clearest business symptom of technical debt is:",
      options: [
        "Engineers complaining",
        "Similar work taking progressively longer over time",
        "Too many repositories",
        "High cloud spend",
      ],
      answerIndex: 1,
      explanation:
        "Slowing delivery for equivalent work is the measurable signal, and it makes debt discussable with non-engineers.",
    },
    customerQuestion:
      "Is there work your team keeps postponing because it is tedious rather than hard? What does postponing it cost you?",
    questionImplication:
      "Postponed tedious work is the ideal bounded first project, and the cost question turns it into an Implication.",
    businessImpact:
      "Speed and cost: debt increases the price of every future change, compounding quietly.",
  },
  {
    id: "a-legacy-system",
    module: "A",
    title: "Legacy system",
    skills: ["technicalFluency", "empathy"],
    definition:
      "A legacy system is older software that is still important to the business, often with few people who fully understand it.",
    whyCtoCares:
      "Legacy systems concentrate risk in a handful of people. When those people are busy or leave, the business is exposed.",
    devinConnection:
      "Devin can explain how unfamiliar parts of a codebase work in plain English, which reduces dependence on the one person who knows.",
    example:
      "A twelve-year-old billing service that still processes most revenue and that only one engineer really understands.",
    misconception:
      "That legacy means bad and should be replaced. Usually it means load-bearing and should be understood before being touched.",
    knowledgeCheck: {
      question: "Which risk is most acute with legacy systems?",
      options: [
        "Cloud cost",
        "Knowledge concentrated in very few people",
        "Poor design aesthetics",
        "Slow builds",
      ],
      answerIndex: 1,
      explanation:
        "Key-person risk is the concern that resonates most with engineering leaders responsible for continuity.",
    },
    customerQuestion:
      "Which system would be hardest for your team to change if the person who knows it best were unavailable for a month?",
    questionImplication:
      "You surface key-person risk, which is emotionally real to a VP of Engineering and rarely being addressed.",
    businessImpact:
      "Risk: continuity and onboarding risk, plus slower delivery in the systems that matter most.",
  },
  {
    id: "a-api",
    module: "A",
    title: "API",
    skills: ["technicalFluency"],
    definition:
      "An API (a structured way for software systems to communicate) is the contract one system offers so others can use it.",
    whyCtoCares:
      "APIs are contracts. Breaking one can break customers or partners without any visible change to the user interface.",
    devinConnection:
      "Because Devin follows existing patterns in the repo, it can extend an API in the shape the team already uses rather than inventing a new convention.",
    example:
      "A mobile app calls the company's API to fetch a customer's order history.",
    misconception:
      "That an API is a product feature. It is an interface, and its stability is a promise to whoever depends on it.",
    knowledgeCheck: {
      question: "Why are API changes sensitive?",
      options: [
        "They are hard to write",
        "Other systems depend on the existing contract and can break silently",
        "They require new servers",
        "They always need a redesign",
      ],
      answerIndex: 1,
      explanation:
        "Understanding contract risk lets you talk credibly about why review and tests matter on interface changes.",
    },
    customerQuestion:
      "Which of your interfaces are depended on by other teams or customers, and how do you manage changes to them today?",
    questionImplication:
      "You learn where change is riskiest, which shapes a first project that avoids their most sensitive surface.",
    businessImpact:
      "Risk: a broken contract affects partners and customers, not just internal teams.",
  },
  {
    id: "a-database",
    module: "A",
    title: "Database",
    skills: ["technicalFluency"],
    definition:
      "A database is where an application's persistent data is organized and stored.",
    whyCtoCares:
      "Data is the hardest thing to undo. Code can be reverted in minutes; a bad data change can be permanent.",
    devinConnection:
      "Work that touches data usually needs a migration and extra human care, so it is a poor choice for a first Devin project.",
    example:
      "Customer accounts, orders, and subscription states all live in a database.",
    misconception:
      "That data changes are as reversible as code changes. They are not, which is why data-loss risk deserves its own conversation.",
    knowledgeCheck: {
      question: "Which change carries the least reversible risk?",
      options: [
        "Deleting a database column",
        "Changing the label on a button",
        "Rewriting stored customer records",
        "Dropping a table",
      ],
      answerIndex: 1,
      explanation:
        "Recognizing irreversibility is how you scope safe first projects and earn trust with cautious buyers.",
    },
    customerQuestion:
      "Are there parts of the system where you would want extra human sign-off because mistakes are hard to undo?",
    questionImplication:
      "Asking this before they raise it demonstrates judgement and makes you a safer partner in their eyes.",
    businessImpact:
      "Risk: data mistakes can mean permanent loss, compliance exposure, and customer trust damage.",
  },
  {
    id: "a-authentication",
    module: "A",
    title: "Authentication",
    skills: ["technicalFluency"],
    definition:
      "Authentication is verifying who a user is.",
    whyCtoCares:
      "Identity is the front door. Mistakes here are security incidents, not bugs.",
    devinConnection:
      "Security-sensitive areas are where a customer's review requirements should be strictest, and where you should propose narrower scope.",
    example:
      "Logging in with an email, a password, and a one-time code is authentication.",
    misconception:
      "That authentication and authorization are the same thing. One asks who you are, the other what you may do.",
    knowledgeCheck: {
      question: "Authentication answers which question?",
      options: [
        "What is this user allowed to do?",
        "Who is this user?",
        "Where is this user located?",
        "How fast is this user's connection?",
      ],
      answerIndex: 1,
      explanation:
        "Getting this distinction right in front of a security leader signals that you did your homework.",
    },
    customerQuestion:
      "Which areas of your codebase would you consider off-limits or requiring extra scrutiny for any new tool?",
    questionImplication:
      "You gather their security boundaries early, which prevents a late-stage surprise from the security team.",
    businessImpact:
      "Risk: identity failures are breach-class events with regulatory and reputational cost.",
  },
  {
    id: "a-authorization",
    module: "A",
    title: "Authorization",
    skills: ["technicalFluency"],
    definition:
      "Authorization is deciding what an authenticated user is allowed to do.",
    whyCtoCares:
      "Most real-world data exposure comes from someone being able to see or do more than intended.",
    devinConnection:
      "Permission logic is subtle and high-consequence, so it is an area to demonstrate careful review and tests rather than speed.",
    example:
      "A support agent can view an order but not issue a refund above a set amount.",
    misconception:
      "That authorization is a small configuration detail. It is business rules encoded in software.",
    knowledgeCheck: {
      question: "Which is an authorization decision?",
      options: [
        "Checking a password",
        "Sending a one-time code",
        "Deciding whether this user may delete another user's record",
        "Storing a session cookie",
      ],
      answerIndex: 2,
      explanation:
        "Authorization is about permitted actions, and it is where least-privilege thinking applies.",
    },
    customerQuestion:
      "How do you control what tools and people can access in your codebase and environments today?",
    questionImplication:
      "You surface their access model, which is the language the security leader will use to evaluate you.",
    businessImpact:
      "Risk: over-broad permissions turn a small mistake into a large incident.",
  },
  {
    id: "a-feature-flag",
    module: "A",
    title: "Feature flag",
    skills: ["technicalFluency"],
    definition:
      "A feature flag is a switch that enables or disables functionality without changing the code that is deployed.",
    whyCtoCares:
      "Flags decouple deploying from releasing, which lowers the stakes of every change.",
    devinConnection:
      "Suggesting that a first change ship behind a flag is a credible way to reduce a cautious buyer's perceived risk.",
    example:
      "A new checkout flow is enabled for 5% of customers and turned off instantly if problems appear.",
    misconception:
      "That flags are a workaround. Mature teams use them deliberately as a risk-control mechanism.",
    knowledgeCheck: {
      question: "A feature flag primarily reduces:",
      options: [
        "Build time",
        "The blast radius of a change going wrong",
        "Code review effort",
        "Cloud cost",
      ],
      answerIndex: 1,
      explanation:
        "Blast-radius language is exactly how engineering leaders think about risk.",
    },
    customerQuestion:
      "Do you use feature flags today? Would putting a first change behind one make this easier to try?",
    questionImplication:
      "You offer a bounded, low-risk next step, which moves a hesitant buyer forward without a big commitment.",
    businessImpact:
      "Risk: flags let a team test in production safely and roll back in seconds.",
  },
  {
    id: "a-rollback",
    module: "A",
    title: "Rollback",
    skills: ["technicalFluency"],
    definition:
      "A rollback is reverting to a previous working version of the software.",
    whyCtoCares:
      "How fast a team can roll back determines how bad a bad change actually is.",
    devinConnection:
      "Because Devin's work arrives as reviewable commits on a branch, reverting it uses the team's normal revert process.",
    example:
      "A release causes checkout errors, so the team reverts to the previous version within minutes.",
    misconception:
      "That rollback fixes everything. Data changes and third-party effects may not be reversible.",
    knowledgeCheck: {
      question: "Which claim about rollback is accurate?",
      options: [
        "Rollback always fully undoes a change",
        "Rollback restores previous code, but data changes may not be reversible",
        "Rollback is only possible with feature flags",
        "Rollback requires rewriting the change",
      ],
      answerIndex: 1,
      explanation:
        "Precision about limits is more persuasive than a blanket reassurance a technical buyer knows is false.",
    },
    customerQuestion:
      "If a change caused a problem tomorrow, how quickly could you detect it and roll it back?",
    questionImplication:
      "Their answer tells you how much residual risk they actually carry, and it usually lowers their fear of trying something bounded.",
    businessImpact:
      "Risk: fast, reliable rollback is what makes experimentation affordable.",
  },
];
