import type { Objection } from "@/lib/types";

export const objections: Objection[] = [
  {
    id: "obj-security-risk",
    objection: "AI will create security risk.",
    whyTheyAskIt:
      "They are personally accountable if code or customer data is exposed, and they have no way yet to judge your risk profile.",
    acknowledge:
      "That is the right thing to be careful about — it is the first question I would ask in your position.",
    clarify:
      "Is the concern mainly about code leaving your boundary, about the scope of access, or about being able to audit what changed?",
    discoveryQuestion:
      "What does your security review normally require from a vendor that needs repository access, and who would need to be involved?",
    devinWorkflow:
      "Access is scoped to specific repositories, work happens on a branch, and every change arrives as an attributable pull request — so there is an audit trail of exactly what was changed and by whom.",
    evidenceOrNextStep:
      "Let us start your security review in parallel with the technical evaluation rather than after it, so the paperwork is not the thing that adds two months.",
    avoid: [
      "Leading with a compliance badge instead of answering the specific control question",
      "Saying 'it is completely secure' or promising no risk",
      "Implying their security team is being obstructive",
    ],
    contextKeywords: ["security", "access", "code", "data", "risk", "audit", "review"],
  },
  {
    id: "obj-developers-themselves",
    objection: "Our developers can do this themselves.",
    whyTheyAskIt:
      "They are protecting their team's competence and status, and they suspect you are implying otherwise.",
    acknowledge:
      "They absolutely can — capability was never the question I am asking about.",
    clarify:
      "The question is what they are choosing not to do because their time goes elsewhere. Is there work like that?",
    discoveryQuestion:
      "What is sitting in your backlog that is well understood but keeps getting postponed because nobody has time for it?",
    devinWorkflow:
      "Bounded, tedious, well-specified work — a mechanical cleanup across many files, a repetitive migration, flaky-test triage — handled under your engineers' review rather than instead of them.",
    evidenceOrNextStep:
      "Pick one of those postponed items and let your most skeptical engineer judge the resulting pull request.",
    avoid: [
      "Any suggestion that their engineers are slow or replaceable",
      "Arguing about capability instead of capacity",
    ],
    contextKeywords: ["developers", "themselves", "team", "capable", "backlog", "time"],
  },
  {
    id: "obj-already-copilot",
    objection: "We already use Copilot.",
    whyTheyAskIt:
      "They have made an investment, adoption is good, and adding overlapping tools is a real cost.",
    acknowledge:
      "That is great, and it is worth keeping — those tools are genuinely good at what they do.",
    clarify:
      "What kind of work do they help with most, and where do your engineers still have to step in and take over manually?",
    discoveryQuestion:
      "Of the work where engineers still have to take over, which part is the most repetitive?",
    devinWorkflow:
      "Editor assistants help an engineer who is already working on something. The gap is usually the layer around it: picking up a described ticket, following repo patterns, running the tests, and opening a reviewable pull request.",
    evidenceOrNextStep:
      "Draw the boundary explicitly, then test it on one ticket nobody was going to get to this month.",
    avoid: [
      "Attacking the incumbent tool or its users",
      "Claiming to be 'more autonomous' without saying what work that means",
      "Suggesting they rip out something that is working",
    ],
    contextKeywords: ["copilot", "already", "tools", "assistant", "existing", "overlap"],
  },
  {
    id: "obj-trust-autonomous",
    objection: "We do not trust autonomous changes.",
    whyTheyAskIt:
      "They imagine changes reaching production without a human deciding, which would remove the control their process depends on.",
    acknowledge:
      "I would not trust unsupervised changes to a production system either.",
    clarify:
      "When you say autonomous, is the worry that changes reach production without review, or that reviewing them will cost more than writing them?",
    discoveryQuestion:
      "What would you need to see attached to a change to be comfortable merging it?",
    devinWorkflow:
      "Work happens on a branch and arrives as a pull request with the tests and linter run, the diff explained, and the risk stated. Merging and deploying stay entirely inside your existing process.",
    evidenceOrNextStep:
      "Start with a plan-first task: approve the plan in plain English before any code is written, then judge the pull request.",
    avoid: [
      "Using 'autonomous' as a selling point without immediately explaining the review boundary",
      "Claiming a low error rate you cannot source",
    ],
    contextKeywords: ["trust", "autonomous", "review", "production", "control", "merge"],
  },
  {
    id: "obj-codebase-complex",
    objection: "Our codebase is too complex.",
    whyTheyAskIt:
      "They have seen tools fail on their real code, and they are usually right about where the sharp edges are.",
    acknowledge:
      "You know your codebase and I do not, so I will take that seriously rather than argue with it.",
    clarify:
      "Which part would you least trust it on — and is there a part you would consider bounded enough to be a fair test?",
    discoveryQuestion:
      "Where in the codebase is change most painful today, and what makes it painful — the code itself, or the knowledge being concentrated in a few people?",
    devinWorkflow:
      "Reading the repo and following the patterns of an existing similar file, and being able to explain how an unfamiliar part of the system works in plain English — which is often more valuable in a complex codebase than writing new code.",
    evidenceOrNextStep:
      "Pick a bounded, well-specified task in the messiest area they are willing to expose, and let them judge the pull request.",
    avoid: [
      "Telling them their codebase is not that complex",
      "Promising it will handle anything",
    ],
    contextKeywords: ["complex", "codebase", "legacy", "messy", "old", "monolith"],
  },
  {
    id: "obj-roi-unclear",
    objection: "The ROI is unclear.",
    whyTheyAskIt:
      "They have to defend the spend to someone who does not care about engineering mechanics, and vendor productivity claims do not survive that room.",
    acknowledge:
      "It is unclear, and I would be suspicious of a percentage claim from me too.",
    clarify:
      "Is it that you do not know what would improve, or that you do not have a number you would be able to defend internally?",
    discoveryQuestion:
      "Which number that you already track would be the fairest test of whether this helped?",
    devinWorkflow:
      "Anchor on an existing measured number — manual QA hours per release, recurring toil days per month, review latency, onboarding time — and agree up front how it will be measured.",
    evidenceOrNextStep:
      "Agree one metric and one bounded scope for a first phase, so the result is a fact rather than an opinion.",
    avoid: [
      "Industry productivity statistics as a substitute for their own baseline",
      "Inventing a business case they never validated",
    ],
    contextKeywords: ["roi", "value", "cost", "measure", "business case", "metric", "justify"],
  },
  {
    id: "obj-replacing-engineers",
    objection: "This sounds like replacing engineers.",
    whyTheyAskIt:
      "Either they fear their team's reaction, or they are worried about how it will be read above them. These need different answers.",
    acknowledge:
      "That concern is fair, and if your team believes it, nothing else about the tool matters.",
    clarify:
      "Is the worry more about how your engineers would react, or about how this would be interpreted further up as a headcount decision?",
    discoveryQuestion:
      "What would make this feel like help rather than a threat to your team?",
    devinWorkflow:
      "The defensible frame is capacity: the same team gets the postponed and repetitive work done, with engineers reviewing and directing rather than typing.",
    evidenceOrNextStep:
      "Let the most skeptical engineer choose the first task and judge the output, so adoption is not something imposed on them.",
    avoid: [
      "Efficiency language without addressing the human question",
      "Sweeping claims about the future of engineering jobs",
    ],
    contextKeywords: ["replace", "headcount", "jobs", "engineers", "team", "reduce", "layoff"],
  },
  {
    id: "obj-procurement-slow",
    objection: "Procurement will take too long.",
    whyTheyAskIt:
      "It genuinely does, and they have watched good tools die in the process.",
    acknowledge:
      "You are probably right, and pretending otherwise would not help either of us.",
    clarify:
      "Which part usually takes longest for you — security review, legal, or the business case sitting in a queue?",
    discoveryQuestion:
      "Can we start the long part now, in parallel with the technical evaluation, rather than after it?",
    devinWorkflow:
      "Nothing about the product changes this; what changes the timeline is sequencing security documentation and the business case in parallel with the evaluation.",
    evidenceOrNextStep:
      "Send security documentation and a one-line business case with a number in it before the evaluation finishes.",
    avoid: [
      "Suggesting ways around procurement",
      "Applying end-of-quarter pressure to a process they do not control",
    ],
    contextKeywords: ["procurement", "legal", "process", "slow", "timeline", "contract", "vendor"],
  },
  {
    id: "obj-no-external-access",
    objection: "We cannot give an external tool access to our code.",
    whyTheyAskIt:
      "It may be policy, it may be a previous incident, or it may be an unexamined default. Which one matters enormously.",
    acknowledge:
      "Understood, and that is a reasonable default position for a codebase that matters.",
    clarify:
      "Is that a formal policy, or the current default? And is there a category of repository where the bar is different?",
    discoveryQuestion:
      "What would have to be true about access scope, data handling, and auditability for that position to change?",
    devinWorkflow:
      "Least-privilege access scoped to named repositories, work isolated on branches, and an auditable trail of every proposed change.",
    evidenceOrNextStep:
      "Bring their security lead in early and work to their documented requirements rather than trying to satisfy the objection in the room.",
    avoid: [
      "Trying to talk them out of a security policy",
      "Proposing they quietly start on a low-importance repository as a workaround",
    ],
    contextKeywords: ["access", "external", "code", "policy", "security", "boundary", "cannot"],
  },
  {
    id: "obj-adoption",
    objection: "Our developers will not adopt it.",
    whyTheyAskIt:
      "They have bought tools that went unused, and they know that adoption, not licensing, is the real cost.",
    acknowledge:
      "That is the failure mode I would worry about most too — an unused tool is worse than no tool.",
    clarify:
      "When adoption has failed before, was it because the tool added work, or because nobody owned it?",
    discoveryQuestion:
      "Who on your team feels the relevant pain most acutely day to day, and what would make their week visibly better?",
    devinWorkflow:
      "Adoption tends to follow the person whose toil disappears — the release tester, the maintainer of the monthly upgrade round. Persistent knowledge notes also mean corrections do not have to be repeated, which is what usually makes teams give up.",
    evidenceOrNextStep:
      "Name an internal owner and pick a first task that removes work from a specific person, rather than adding a tool to everyone.",
    avoid: [
      "Assuming a mandate from above will produce adoption",
      "Dismissing prior failed rollouts",
    ],
    contextKeywords: ["adopt", "adoption", "unused", "team", "resist", "shelfware", "owner"],
  },
];

export function getObjection(id: string): Objection | undefined {
  return objections.find((o) => o.id === id);
}
