import type { Lesson } from "@/lib/types";

export const moduleCLessons: Lesson[] = [
  {
    id: "c-overview",
    module: "C",
    title: "Why SPIN before pitching",
    skills: ["spin", "empathy"],
    definition:
      "SPIN is a discovery sequence: Situation (how things work today), Problem (what is difficult or failing), Implication (the business consequence), Need-payoff (the value of solving it).",
    whyCtoCares:
      "A buyer who has articulated their own consequence does not need to be convinced by you. A buyer who has only heard a pitch does.",
    devinConnection:
      "Devin has many capabilities, which makes premature pitching very tempting. Discovery is what makes a demo land.",
    example:
      "Weak: 'Devin can run tests in a browser.' Strong: 'How much manual clicking happens before a release, and what does that delay cost you?'",
    misconception:
      "That discovery is a checklist to get through before pitching. It is the part that makes the pitch unnecessary.",
    knowledgeCheck: {
      question: "The most common discovery mistake is:",
      options: [
        "Asking too many Situation questions",
        "Jumping to product capabilities as soon as any problem is mentioned",
        "Taking notes",
        "Asking about metrics",
      ],
      answerIndex: 1,
      explanation:
        "Pitching on the first hint of a problem skips the Implication that creates urgency.",
    },
    customerQuestion:
      "Before I describe anything, can you walk me through how this works for your team today?",
    questionImplication:
      "You establish that you are here to understand, which earns the right to ask harder questions later.",
    businessImpact:
      "Deal quality: opportunities built on articulated consequence survive procurement; ones built on interest do not.",
  },
  {
    id: "c-situation",
    module: "C",
    title: "Situation questions",
    skills: ["spin"],
    definition:
      "Situation questions establish how things work today: tools, team shape, workflow, volumes, and constraints.",
    whyCtoCares:
      "It shows you are willing to understand their reality before proposing anything.",
    devinConnection:
      "Situation answers tell you which Devin workflow is even relevant — a team with no tests needs a different first project than one with a strong pipeline.",
    example:
      "'How many engineers are contributing to this repository, and how do changes get reviewed today?'",
    misconception:
      "That Situation questions are throwaway warm-up. Poor Situation questions are the main reason later questions feel generic.",
    knowledgeCheck: {
      question: "Which is a Situation question?",
      options: [
        "What does that delay cost you per release?",
        "How does a change get from ticket to production today?",
        "Would faster reviews be valuable?",
        "What is difficult about your current process?",
      ],
      answerIndex: 1,
      explanation:
        "Situation questions map the current state without judging it.",
    },
    customerQuestion:
      "How does a change get from ticket to production today, and who touches it along the way?",
    questionImplication:
      "You learn the stakeholders you will eventually need, in the same breath as the workflow.",
    businessImpact:
      "Relevance: everything you say later can be anchored to their actual process.",
  },
  {
    id: "c-problem",
    module: "C",
    title: "Problem questions",
    skills: ["spin"],
    definition:
      "Problem questions surface what is difficult, slow, unreliable, or failing in the current process.",
    whyCtoCares:
      "Naming the problem in their own words is what makes the rest of the conversation theirs rather than yours.",
    devinConnection:
      "Problems worth pursuing map to a workflow you can actually demonstrate: review latency, manual QA, repetitive maintenance, onboarding difficulty.",
    example:
      "'Where does that process usually get stuck?' rather than 'Is code review a problem for you?'",
    misconception:
      "That a problem statement is enough to create urgency. Without Implication, a problem is just an annoyance.",
    knowledgeCheck: {
      question: "Which problem question is stronger?",
      options: [
        "Is your review process slow?",
        "Where does a change usually wait the longest, and why?",
        "Do you want to move faster?",
        "Are your engineers frustrated?",
      ],
      answerIndex: 1,
      explanation:
        "Open questions produce specifics; yes/no questions produce agreement without information.",
    },
    customerQuestion:
      "Where does a change usually wait the longest, and what is happening during that wait?",
    questionImplication:
      "You separate the symptom from the bottleneck, which prevents you from demoing the wrong thing.",
    businessImpact:
      "Focus: you learn which single problem is worth a first project.",
  },
  {
    id: "c-implication",
    module: "C",
    title: "Implication questions",
    skills: ["spin"],
    definition:
      "Implication questions explore the business, financial, or strategic consequence of the problem.",
    whyCtoCares:
      "This is where a technical annoyance becomes a funded priority. It is also the step most sellers skip.",
    devinConnection:
      "Implications become the metrics in MEDDICCC — release delay, unplanned work percentage, senior-engineer hours, onboarding weeks.",
    example:
      "'If reviews wait three days, what does that do to your release schedule and to what the team can commit to this quarter?'",
    misconception:
      "That Implication questions feel pushy. Asked with curiosity, they feel like someone finally taking the problem seriously.",
    knowledgeCheck: {
      question: "Which is an Implication question?",
      options: [
        "How long do reviews take?",
        "What does that review delay cost you in released features per quarter?",
        "Would you like faster reviews?",
        "Who reviews code today?",
      ],
      answerIndex: 1,
      explanation:
        "Implication connects the observed problem to a consequence the business measures.",
    },
    customerQuestion:
      "What has that cost you so far — in delayed releases, unplanned work, or commitments you had to pull back?",
    questionImplication:
      "The answer becomes the business case you will reuse with the economic buyer.",
    businessImpact:
      "Urgency: quantified consequence is what gets budget attention.",
  },
  {
    id: "c-need-payoff",
    module: "C",
    title: "Need-payoff questions",
    skills: ["spin"],
    definition:
      "Need-payoff questions invite the buyer to describe the value of solving the problem.",
    whyCtoCares:
      "When the buyer states the value, your claims become confirmation rather than assertion.",
    devinConnection:
      "Only after this should you propose a demonstration, and it should be the demo that matches the value they just described.",
    example:
      "'If review time halved without lowering quality, what would that let your team take on?'",
    misconception:
      "That this is a leading question trick. Done badly it is; done well it asks them to think about their own upside.",
    knowledgeCheck: {
      question: "Need-payoff questions should come:",
      options: [
        "Before Situation questions",
        "After the implication has been explored",
        "Only in the final negotiation",
        "In the first thirty seconds",
      ],
      answerIndex: 1,
      explanation:
        "Value is only meaningful once the consequence is on the table.",
    },
    customerQuestion:
      "If that bottleneck eased, what would your team be able to take on that it cannot today?",
    questionImplication:
      "Their answer defines the success criteria for a pilot, in their language.",
    businessImpact:
      "Deal quality: buyer-stated value is the most durable argument in procurement.",
  },
];

export const moduleDLessons: Lesson[] = [
  {
    id: "d-metrics",
    module: "D",
    title: "Metrics",
    skills: ["meddiccc"],
    definition:
      "Metrics are the measurable business impact the buyer would use to judge whether this worked.",
    whyCtoCares:
      "Without a metric, a successful pilot is a matter of opinion — and opinions do not survive budget reviews.",
    devinConnection:
      "Realistic engineering metrics: review latency, cycle time, share of unplanned work, manual QA hours per release, onboarding time, recurring toil hours.",
    example:
      "'Manual regression testing takes two engineers a day and a half per release, every two weeks.'",
    misconception:
      "That the metric must be a percentage productivity claim. A concrete hours-per-release number is stronger and safer.",
    knowledgeCheck: {
      question: "Which is the strongest metric to anchor a pilot on?",
      options: [
        "Engineers feel more productive",
        "Manual regression testing takes 24 engineer-hours per release",
        "AI adoption increases",
        "Code quality improves",
      ],
      answerIndex: 1,
      explanation:
        "Specific, countable, already-collected numbers are what survive scrutiny.",
    },
    customerQuestion:
      "If we tried something here, what number would you want to see move — and where does that number come from today?",
    questionImplication:
      "You establish the success criteria and find out whether the data even exists, before a pilot begins.",
    businessImpact:
      "Deal quality: an agreed metric is what turns a pilot into a purchase.",
  },
  {
    id: "d-economic-buyer",
    module: "D",
    title: "Economic buyer",
    skills: ["meddiccc"],
    definition:
      "The economic buyer is the person who controls or approves the budget for this kind of purchase.",
    whyCtoCares:
      "Enthusiasm from someone without budget authority produces long, pleasant, unclosable cycles.",
    devinConnection:
      "The economic buyer usually cares about capacity, delivery predictability, and risk — not about engineering mechanics.",
    example:
      "'Who signs off on tooling spend at this level, and have they funded anything like this before?'",
    misconception:
      "That the economic buyer is always the CTO. It may be a VP, a CFO, or a platform budget owner.",
    knowledgeCheck: {
      question: "The safest way to ask about budget authority is:",
      options: [
        "Are you the decision maker?",
        "Who else is usually involved when spend at this level gets approved?",
        "Can you sign this?",
        "Do you have budget?",
      ],
      answerIndex: 1,
      explanation:
        "Asking about the process rather than the person avoids implying they lack authority.",
    },
    customerQuestion:
      "Who else is usually involved when spend at this level gets approved?",
    questionImplication:
      "You map authority without insulting anyone, and you learn the real approval path.",
    businessImpact:
      "Forecast accuracy: deals without an identified economic buyer slip indefinitely.",
  },
  {
    id: "d-decision-criteria",
    module: "D",
    title: "Decision criteria",
    skills: ["meddiccc"],
    definition:
      "Decision criteria are the standards the buyer will use to evaluate options.",
    whyCtoCares:
      "If security review and reviewability are their criteria, a speed-focused pitch simply misses.",
    devinConnection:
      "Common technical criteria: code access model, reviewability of output, integration with existing workflow, quality evidence, and vendor security posture.",
    example:
      "'What would this have to prove for your team to be comfortable using it on real work?'",
    misconception:
      "That criteria are fixed. Early in a cycle you can help shape them — later you can only meet them.",
    knowledgeCheck: {
      question: "Why ask about decision criteria early?",
      options: [
        "To speed up the contract",
        "Because early criteria can still be influenced and you can avoid pitching the wrong things",
        "To find the champion",
        "To set the price",
      ],
      answerIndex: 1,
      explanation:
        "Criteria set the terms of the evaluation, which matters more than any single feature.",
    },
    customerQuestion:
      "What would this have to prove before your team would be comfortable using it on real work?",
    questionImplication:
      "You get an explicit checklist you can design a proof of value against.",
    businessImpact:
      "Win rate: aligning to stated criteria beats out-featuring a competitor.",
  },
  {
    id: "d-decision-process",
    module: "D",
    title: "Decision process",
    skills: ["meddiccc"],
    definition:
      "The decision process is the sequence of steps and people involved in getting to an approval.",
    whyCtoCares:
      "Skipping a step — security review, architecture council, procurement — resets the clock late in the cycle.",
    devinConnection:
      "For engineering tools, expect a security review of code access. Raising it yourself is far better than being surprised by it.",
    example:
      "'After a technical evaluation, what happens next — security review, architecture sign-off, procurement?'",
    misconception:
      "That process questions are administrative. They are the most reliable predictor of a realistic timeline.",
    knowledgeCheck: {
      question: "Which is a decision-process question?",
      options: [
        "What metrics matter?",
        "After a successful technical evaluation, what are the next steps and who is involved?",
        "Who is your champion?",
        "What is your pain?",
      ],
      answerIndex: 1,
      explanation:
        "Process questions produce a map of steps and owners.",
    },
    customerQuestion:
      "After a successful technical evaluation, what are the next steps and who has to be involved?",
    questionImplication:
      "You uncover hidden gates early enough to run them in parallel rather than in series.",
    businessImpact:
      "Forecast accuracy: unmapped steps are the usual cause of slipped close dates.",
  },
  {
    id: "d-identify-pain",
    module: "D",
    title: "Identify pain",
    skills: ["meddiccc", "spin"],
    definition:
      "Identified pain is the specific, urgent business problem the buyer wants solved.",
    whyCtoCares:
      "Without urgency, a good tool loses to doing nothing — which is the most common competitor.",
    devinConnection:
      "The pain must be one you can point a concrete Devin workflow at, otherwise the demonstration will feel generic.",
    example:
      "'We committed to a compliance deadline and the migration work needed is sitting untouched.'",
    misconception:
      "That interest equals pain. Interest is curiosity; pain has a consequence attached to it.",
    knowledgeCheck: {
      question: "Which of these is identified pain?",
      options: [
        "They think AI is interesting",
        "A committed deadline is at risk because required work is not starting",
        "They have many repositories",
        "They use several tools",
      ],
      answerIndex: 1,
      explanation:
        "Pain has a consequence and a clock. Interest has neither.",
    },
    customerQuestion:
      "Of everything we have discussed, which one is actually causing you a problem this quarter?",
    questionImplication:
      "You force prioritization, which protects you from a pilot aimed at something nobody urgently cares about.",
    businessImpact:
      "Urgency: quantified, time-bound pain is what beats inertia.",
  },
  {
    id: "d-champion",
    module: "D",
    title: "Champion",
    skills: ["meddiccc", "empathy"],
    definition:
      "A champion is an internal person motivated to help the deal succeed, with credibility inside the organization.",
    whyCtoCares:
      "Someone has to make the internal case in rooms you will never be in.",
    devinConnection:
      "Champions often emerge from the person whose repetitive work goes away — the release tester, the maintainer of the tedious migration.",
    example:
      "The engineer who runs manual regression every fortnight and would rather not.",
    misconception:
      "That a friendly contact is a champion. A champion has both motivation and internal credibility.",
    knowledgeCheck: {
      question: "A friendly contact with no influence is best described as:",
      options: [
        "A champion",
        "A low-authority supporter who cannot carry the internal case alone",
        "The economic buyer",
        "A blocker",
      ],
      answerIndex: 1,
      explanation:
        "Mistaking a supporter for a champion is one of the most common ways a deal quietly stalls.",
    },
    customerQuestion:
      "Who on your team feels this problem most acutely day to day?",
    questionImplication:
      "You find the person with genuine motivation, and you can then test whether they also have credibility.",
    businessImpact:
      "Win rate: deals without a credible internal advocate rarely survive competing priorities.",
  },
  {
    id: "d-competition",
    module: "D",
    title: "Competition",
    skills: ["meddiccc", "objections"],
    definition:
      "Competition includes other vendors, internal build alternatives, and doing nothing.",
    whyCtoCares:
      "Doing nothing is free, safe, and usually winning. It deserves more respect than rival vendors do.",
    devinConnection:
      "Existing AI coding assistants are usually complements to discover around, not enemies to attack. Ask where engineers still step in manually.",
    example:
      "'Our developers already use an AI assistant' → 'What work does it help with, and where do engineers still have to take over?'",
    misconception:
      "That competition means naming rivals. The real question is what the alternative to acting is.",
    knowledgeCheck: {
      question: "A customer says 'our developers already use AI tools.' The best response is:",
      options: [
        "Devin is much more autonomous.",
        "That is great — what work do those tools help with, and where do engineers still step in manually?",
        "You should replace those tools with Devin.",
        "How many developers do you have?",
      ],
      answerIndex: 1,
      explanation:
        "It acknowledges the existing investment, uncovers the current workflow, and looks for an unmet need instead of attacking the competitor.",
    },
    customerQuestion:
      "If you did nothing about this for another two quarters, what happens?",
    questionImplication:
      "You test the strength of the status quo, which is the alternative you most often lose to.",
    businessImpact:
      "Forecast accuracy: an unexamined status quo is where most forecasted deals actually go.",
  },
  {
    id: "d-paper-process",
    module: "D",
    title: "Paper process",
    skills: ["meddiccc"],
    definition:
      "The paper process is everything between a decision and a signature: legal, procurement, security review, and contracting.",
    whyCtoCares:
      "For a tool that touches source code, security review is usually the longest step, and it starts late unless you start it early.",
    devinConnection:
      "Offer to begin security documentation in parallel with the technical evaluation rather than after it.",
    example:
      "'Would it help to start your security review process in parallel while we run the technical evaluation?'",
    misconception:
      "That paperwork is someone else's problem. It is the most predictable source of slippage you can actually influence.",
    knowledgeCheck: {
      question: "The best time to raise security review is:",
      options: [
        "After the technical evaluation succeeds",
        "Early, in parallel with the technical evaluation",
        "Only if the customer raises it",
        "During contract negotiation",
      ],
      answerIndex: 1,
      explanation:
        "Running the long pole in parallel is the single most effective timeline intervention.",
    },
    customerQuestion:
      "What does your security and procurement path look like for a tool that needs repository access?",
    questionImplication:
      "You surface the longest step early and can start it in parallel, compressing the overall timeline.",
    businessImpact:
      "Timeline: security and procurement usually determine the close date, not the technical decision.",
  },
  {
    id: "d-compelling-event",
    module: "D",
    title: "Compelling event",
    skills: ["meddiccc"],
    definition:
      "A compelling event is a deadline or business event that creates real urgency.",
    whyCtoCares:
      "Without one, even a well-qualified deal drifts behind whatever is on fire this month.",
    devinConnection:
      "Common events in engineering: a compliance deadline, a platform migration, a hiring freeze with unchanged commitments, a major launch.",
    example:
      "'We have a hiring freeze but the same roadmap commitments for next quarter.'",
    misconception:
      "That you can manufacture urgency. You can only find it, or help them see a consequence they already own.",
    knowledgeCheck: {
      question: "Which is a genuine compelling event?",
      options: [
        "End of your sales quarter",
        "A compliance deadline requiring work the team has not started",
        "A discount expiring",
        "A new product release from your side",
      ],
      answerIndex: 1,
      explanation:
        "Urgency has to belong to the customer's business to be real.",
    },
    customerQuestion:
      "Is there a date or commitment that makes solving this more urgent than it was six months ago?",
    questionImplication:
      "You either find real urgency or learn that you are working an interested but unmotivated buyer.",
    businessImpact:
      "Timeline: a customer-owned deadline is the only reliable accelerator.",
  },
];

export const moduleELessons: Lesson[] = [
  {
    id: "e-security-access",
    module: "E",
    title: "Security and code access",
    skills: ["empathy", "objections"],
    definition:
      "The buyer's concern: giving an external system access to source code creates a new exposure surface to justify to their security team.",
    whyCtoCares:
      "They are personally accountable if code or customer data leaks. This concern is rational, not obstructive.",
    devinConnection:
      "Acknowledge it, ask what their review process requires, and offer to engage security early with documentation. Never wave it away.",
    example:
      "'That is the right question to ask before anything else. What does your security review normally require from a vendor at this stage?'",
    misconception:
      "That reassurance solves it. Process engagement solves it; reassurance without evidence increases suspicion.",
    knowledgeCheck: {
      question: "Best first move on a security objection:",
      options: [
        "Explain that the product is secure",
        "Acknowledge it, then ask what their security review process requires",
        "Offer a discount",
        "Move the conversation to features",
      ],
      answerIndex: 1,
      explanation:
        "Turning the objection into a process question shows you take it as seriously as they do.",
    },
    customerQuestion:
      "What does your security review normally require from a vendor that needs repository access?",
    questionImplication:
      "You convert a blocker into a workstream you can start immediately.",
    businessImpact:
      "Timeline and trust: security engagement is both the longest step and the biggest trust signal.",
  },
  {
    id: "e-code-quality-trust",
    module: "E",
    title: "Code quality and developer trust",
    skills: ["empathy", "objections"],
    definition:
      "The buyer's concern: AI-generated changes will be plausible-looking but subtly wrong, and reviewing them will cost more than writing them.",
    whyCtoCares:
      "Their team's trust is finite. One bad rollout can poison tooling adoption for years.",
    devinConnection:
      "Talk about small scoped changes, following existing patterns, tests and lint run with output shown, self-review, and never modifying a test to make it pass.",
    example:
      "'The thing I would want in your position is evidence attached to the change — the tests run, the diff explained, and a scope small enough to actually review.'",
    misconception:
      "That quality is proven by claims. It is proven by an artefact their own engineer inspects.",
    knowledgeCheck: {
      question: "Which is the strongest response to a quality concern?",
      options: [
        "Devin writes high-quality code",
        "Pick a bounded task, review the pull request with tests and explanation attached, and judge it yourself",
        "Other customers are happy",
        "The model is state of the art",
      ],
      answerIndex: 1,
      explanation:
        "Offering their own verification beats any assertion you can make.",
    },
    customerQuestion:
      "What would you need to see in a change to trust it enough to merge?",
    questionImplication:
      "You get their acceptance criteria, and you can design a first task that meets them exactly.",
    businessImpact:
      "Risk: sustainable adoption depends on the engineers who review the work, not on the buyer who signs.",
  },
  {
    id: "e-production-risk",
    module: "E",
    title: "Production risk and reviewability",
    skills: ["empathy", "objections"],
    definition:
      "The buyer's concern: an autonomous system will break production or make changes nobody understands.",
    whyCtoCares:
      "Downtime is measured in revenue and reputation, and they own the incident review.",
    devinConnection:
      "Work happens on a branch and arrives as a reviewable pull request; merging and deploying stay in their process. Feature flags and rollback further limit blast radius.",
    example:
      "'Nothing reaches your customers without your normal merge and release process. The question is whether the change that arrives is good enough to approve.'",
    misconception:
      "That autonomy means unsupervised deployment. Autonomy is about doing the work, not about bypassing their gates.",
    knowledgeCheck: {
      question: "Which fact most reduces production-risk anxiety?",
      options: [
        "The tests are comprehensive",
        "Changes arrive as reviewable pull requests and go through the customer's existing release process",
        "The model rarely makes mistakes",
        "Other customers have not had incidents",
      ],
      answerIndex: 1,
      explanation:
        "Control retained inside their existing process is the concrete answer.",
    },
    customerQuestion:
      "What are your current gates between a merged change and customers seeing it?",
    questionImplication:
      "You show that their existing safety net still applies, which lowers perceived novelty and risk.",
    businessImpact:
      "Risk: perceived loss of control is usually a bigger blocker than actual technical risk.",
  },
  {
    id: "e-workflow-integration",
    module: "E",
    title: "Workflow integration and change management",
    skills: ["empathy", "objections"],
    definition:
      "The buyer's concern: adopting this will mean process change, training, and disruption they do not have capacity for.",
    whyCtoCares:
      "Change-management burden falls on the same overloaded people the tool is meant to help.",
    devinConnection:
      "The workflow is the one they have: repository, branch, pull request, review, CI. Setup effort is mostly environment configuration, done once.",
    example:
      "'Your reviewers keep doing what they already do. The main setup work is getting the environment configured once so work can be verified.'",
    misconception:
      "That adoption effort is trivial. Naming the real, modest effort is more convincing than claiming none.",
    knowledgeCheck: {
      question: "The honest description of adoption effort is:",
      options: [
        "No effort at all",
        "Mostly one-time environment setup plus agreeing on which work to hand off",
        "A full process redesign",
        "New tooling for every engineer",
      ],
      answerIndex: 1,
      explanation:
        "Specific, bounded effort is credible; zero effort is not.",
    },
    customerQuestion:
      "Who would own this internally, and how much of their week could they realistically give it?",
    questionImplication:
      "You test whether they have the capacity to succeed, which protects both sides from a failed pilot.",
    businessImpact:
      "Adoption risk: tools that require capacity nobody has do not get used, regardless of quality.",
  },
  {
    id: "e-roi-outcomes",
    module: "E",
    title: "ROI and measurable outcomes",
    skills: ["empathy", "meddiccc"],
    definition:
      "The buyer's concern: they have seen productivity claims before and cannot defend an unmeasurable purchase.",
    whyCtoCares:
      "They have to justify the spend to a CFO who does not care about engineering mechanics.",
    devinConnection:
      "Anchor on a specific, already-collected metric — manual QA hours per release, recurring toil hours, review latency — and agree how it will be measured.",
    example:
      "'Rather than a productivity percentage, let us pick one number you already track and see whether it moves.'",
    misconception:
      "That a bigger claimed number is more persuasive. A smaller, verifiable number is much harder to argue with.",
    knowledgeCheck: {
      question: "Best response to 'the ROI is unclear':",
      options: [
        "Cite an industry productivity statistic",
        "Agree it is unclear, and propose measuring one specific number they already collect",
        "Offer a discount",
        "Explain the technology in more detail",
      ],
      answerIndex: 1,
      explanation:
        "Agreeing and then proposing a concrete measurement respects their skepticism and moves forward.",
    },
    customerQuestion:
      "Which number that you already track would be the fairest test of whether this helped?",
    questionImplication:
      "You co-author the business case, so it survives without you in the room.",
    businessImpact:
      "Deal quality: measurable outcomes are what convert a pilot into a renewal.",
  },
  {
    id: "e-replacing-engineers",
    module: "E",
    title: "Fear of replacing or undermining engineers",
    skills: ["empathy", "objections"],
    definition:
      "The buyer's concern: this is really a headcount story, and their team will resist or resent it.",
    whyCtoCares:
      "Engineering leaders protect their teams. If they suspect a headcount agenda, they disengage quietly.",
    devinConnection:
      "The defensible frame is capacity: the same team gets the postponed, tedious, or repetitive work done, with engineers reviewing and directing rather than typing.",
    example:
      "'The teams that get value point it at the work engineers were never going to get to, not at the work they enjoy.'",
    misconception:
      "That efficiency language is neutral. To an engineering leader, unexamined efficiency language sounds like layoffs.",
    knowledgeCheck: {
      question: "'This sounds like replacing engineers.' Best reply:",
      options: [
        "It is not, it augments them.",
        "Say more about that concern — is it about your team's reaction, or about how you would justify headcount internally?",
        "Every company will do this eventually.",
        "Engineers will still be needed for hard problems.",
      ],
      answerIndex: 1,
      explanation:
        "Clarifying which fear you are actually facing prevents you from answering the wrong one.",
    },
    customerQuestion:
      "How do you think your engineers would react to this, and what would make it feel like help rather than threat?",
    questionImplication:
      "You recruit them as a partner in adoption design and surface the internal politics you must survive.",
    businessImpact:
      "Adoption risk: team resistance kills more engineering tools than product gaps do.",
  },
  {
    id: "e-vendor-procurement",
    module: "E",
    title: "Vendor risk and procurement effort",
    skills: ["empathy", "meddiccc"],
    definition:
      "The buyer's concern: onboarding a new vendor costs internal effort and creates dependency risk.",
    whyCtoCares:
      "Every new vendor adds review cycles, renewal overhead, and a dependency they must be able to exit.",
    devinConnection:
      "Be concrete about what onboarding requires, offer to start security and procurement in parallel, and be honest that there is real effort involved.",
    example:
      "'Procurement is usually the longest part. Would it help if we started that in parallel with the technical evaluation?'",
    misconception:
      "That procurement is a formality to rush. Treating it seriously is often what earns the trust of the buyer's staff.",
    knowledgeCheck: {
      question: "'Procurement will take too long.' Best response:",
      options: [
        "We can go around procurement",
        "You are probably right — what usually takes longest, and can we start that piece now in parallel?",
        "It is faster than you think",
        "Let us wait until next quarter",
      ],
      answerIndex: 1,
      explanation:
        "Accepting their reality and starting the long pole early is the only real lever you have.",
    },
    customerQuestion:
      "What usually takes the longest in your vendor onboarding, and can we start that piece now?",
    questionImplication:
      "You compress the timeline without pressuring anyone, and you look like someone who has done this before.",
    businessImpact:
      "Timeline: procurement and security typically set the close date.",
  },
];
