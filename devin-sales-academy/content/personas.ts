import type { Persona } from "@/lib/types";

export const personas: Persona[] = [
  {
    id: "skeptical-cto",
    name: "Dana Whitfield",
    role: "Skeptical CTO, 180-engineer fintech",
    priorities: [
      "Delivery predictability",
      "Not creating a security incident",
      "Keeping her senior engineers",
    ],
    hiddenPain:
      "A regulatory reporting migration has been on the roadmap for three quarters and keeps being deprioritized. The compliance deadline is now five months away.",
    currentWorkflow:
      "Tickets in Jira, feature branches, pull requests reviewed by two engineers, CI runs tests, releases every two weeks.",
    objections: [
      "AI will create security risk",
      "We do not trust autonomous changes",
      "The ROI is unclear",
    ],
    decisionAuthority: "Owns the engineering tooling budget up to a threshold; larger spend goes to the CFO.",
    buyingCriteria: [
      "Output must be reviewable by her engineers",
      "Security review must pass",
      "No change to her release gates",
    ],
    urgency: "medium",
    likelyCompetition: ["Existing AI coding assistant", "Doing nothing", "Hiring contractors"],
    opening:
      "I have twenty minutes. I will be honest, I have sat through several of these and I am not convinced autonomous coding is real yet. What do you want to cover?",
    pitchPushback:
      "You are describing your product again. I asked about my situation. Can we stay there for a minute?",
    vagueClaimChallenge:
      "That is a big claim. Based on what? I would rather hear something narrower that is actually true.",
    closedQuestionResponse:
      "Yes. — I am happy to go deeper if you ask me something more open than that.",
    layers: [
      {
        topic: "Current delivery workflow",
        triggers: ["workflow", "process", "today", "ticket", "review", "merge", "release", "deploy", "pipeline"],
        reveal:
          "Jira ticket, feature branch, pull request, two reviewers, CI, release every two weeks. On paper it is fine. In practice the review queue is where everything dies.",
        covers: ["situation"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Review bottleneck",
        triggers: ["review", "queue", "bottleneck", "wait", "stuck", "slow", "delay", "longest"],
        reveal:
          "Pull requests wait two to four days for review. My four most senior engineers do most of it, and they are also the people I need on the hard problems.",
        covers: ["problem"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Business consequence of the delay",
        triggers: ["cost", "impact", "consequence", "quarter", "commit", "slip", "miss", "roadmap", "what does that"],
        reveal:
          "We pulled two commitments out of last quarter. And honestly, the thing that worries me more is the regulatory reporting migration we keep pushing.",
        covers: ["implication", "identifyPain"],
        requiresOpenQuestion: true,
      },
      {
        topic: "The migration and its deadline",
        triggers: ["migration", "regulatory", "compliance", "deadline", "postpone", "pushing", "deprioritized", "urgent"],
        reveal:
          "It is a reporting migration required by a regulator. Five months out. It is tedious, well understood, and nobody wants to spend a quarter of their team on it. That is the honest picture.",
        covers: ["identifyPain", "compellingEvent"],
      },
      {
        topic: "Metrics she already tracks",
        triggers: ["metric", "measure", "number", "track", "data", "baseline", "kpi"],
        reveal:
          "I track cycle time and review latency weekly, and unplanned work as a share of the sprint. Review latency is the one my board slide uses.",
        covers: ["metrics"],
      },
      {
        topic: "Security review requirements",
        triggers: ["security", "access", "review process", "soc", "compliance review", "data", "risk"],
        reveal:
          "Anything touching the repository goes through our security architecture review. That is six to eight weeks unless we start early, and my security lead is the one who will kill this if anyone is glib about it.",
        covers: ["paperProcess", "decisionCriteria"],
      },
      {
        topic: "Approval and budget",
        triggers: ["budget", "approve", "spend", "sign", "procurement", "who else", "involved"],
        reveal:
          "I can approve tooling up to a point. Above that the CFO is involved, and she will ask what number moved.",
        covers: ["economicBuyer", "decisionProcess"],
      },
      {
        topic: "Team reaction",
        triggers: ["team", "engineers", "adopt", "react", "resist", "trust", "headcount", "morale"],
        reveal:
          "Two of my seniors will assume this is a headcount conversation. If they decide that, it will not matter what the tool does.",
        covers: ["champion", "competition"],
      },
      {
        topic: "Existing AI tooling",
        triggers: ["copilot", "already", "existing tool", "ai tools", "cursor", "assistant"],
        reveal:
          "They all use an AI assistant in the editor. It helps them type faster. It does not touch the review queue or the migration backlog, which is where my problem actually is.",
        covers: ["competition"],
      },
    ],
  },
  {
    id: "vp-engineering",
    name: "Marcus Idowu",
    role: "VP of Engineering, 60-engineer B2B SaaS",
    priorities: ["Hitting quarterly commitments", "Team morale", "Reducing unplanned work"],
    hiddenPain:
      "A hiring freeze took two open roles away, but the roadmap commitments did not change. He is quietly over-committed for the next two quarters.",
    currentWorkflow:
      "Two-week sprints, trunk-based development, strong test suite, deploys daily behind feature flags.",
    objections: ["This sounds like replacing engineers", "Our developers can do this themselves"],
    decisionAuthority: "Recommends; the CTO signs. Controls how his teams spend time.",
    buyingCriteria: ["Must not add process overhead", "Team must actually adopt it", "Visible within one sprint"],
    urgency: "high",
    likelyCompetition: ["Contractors", "Doing nothing", "Reprioritizing the roadmap"],
    opening:
      "Thanks for making time. I will be straight with you: my problem is capacity, not enthusiasm. Where do you want to start?",
    pitchPushback:
      "I hear the features. What I need to know is whether it survives contact with my actual sprint.",
    vagueClaimChallenge:
      "Can you give me the narrower version of that claim, the one you would be happy to be held to?",
    closedQuestionResponse:
      "Yeah. Ask me something that needs a longer answer and I will give you more.",
    layers: [
      {
        topic: "Current sprint reality",
        triggers: ["sprint", "workflow", "process", "today", "capacity", "commit", "plan"],
        reveal:
          "Two-week sprints, we deploy daily behind flags, tests are good. The issue is that about a third of every sprint gets eaten by unplanned work.",
        covers: ["situation"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Unplanned work",
        triggers: ["unplanned", "interrupt", "firefight", "bug", "support", "maintenance", "toil", "eaten"],
        reveal:
          "Dependency upgrades, small production issues, and a monthly compliance report someone has to assemble by hand. None of it is hard. All of it is a tax.",
        covers: ["problem"],
        requiresOpenQuestion: true,
      },
      {
        topic: "The hiring freeze",
        triggers: ["hiring", "headcount", "freeze", "team size", "resource", "budget", "grow"],
        reveal:
          "We lost two open roles in the freeze. Nobody adjusted the commitments. So I am running the same roadmap with less capacity and I have not told my teams how bad the maths is.",
        covers: ["identifyPain", "compellingEvent"],
      },
      {
        topic: "Consequence",
        triggers: ["cost", "consequence", "impact", "what happens", "slip", "quarter", "miss"],
        reveal:
          "If nothing changes, we miss at least one committed integration next quarter, and that one is in a customer contract.",
        covers: ["implication", "metrics"],
      },
      {
        topic: "Recurring monthly work",
        triggers: ["recurring", "monthly", "repeat", "every release", "routine", "same steps", "playbook"],
        reveal:
          "The compliance report and the dependency upgrade round. Same steps every month, about three engineer-days each time.",
        covers: ["metrics", "identifyPain"],
      },
      {
        topic: "Team adoption",
        triggers: ["team", "adopt", "engineers", "react", "trust", "champion", "who feels"],
        reveal:
          "My platform lead, Priya, does the upgrade round. She would love not to. If she likes it, the rest follow her.",
        covers: ["champion"],
      },
      {
        topic: "Decision path",
        triggers: ["decision", "approve", "process", "next step", "who else", "sign", "cto"],
        reveal:
          "I would recommend it; our CTO signs. He will ask about security and about whether it changes our release process.",
        covers: ["decisionProcess", "economicBuyer", "decisionCriteria"],
      },
    ],
  },
  {
    id: "engineering-manager",
    name: "Sofia Reyes",
    role: "Engineering manager, platform team",
    priorities: ["Predictable delivery", "Protecting her team's focus", "Onboarding new hires faster"],
    hiddenPain:
      "Two new engineers joined six weeks ago and are still not productive because only one person understands the legacy billing service.",
    currentWorkflow:
      "Kanban, pull requests reviewed by whoever is free, thin documentation, long-lived legacy services.",
    objections: ["Our codebase is too complex", "Our developers will not adopt it"],
    decisionAuthority: "No budget authority; strong influence on what her team tries.",
    buyingCriteria: ["Low setup effort", "Helps her new hires", "Does not add review burden"],
    urgency: "medium",
    likelyCompetition: ["Doing nothing", "Writing documentation"],
    opening:
      "Hi. I should say up front I do not control any budget, but I do decide what my team actually uses. What did you want to talk about?",
    pitchPushback:
      "That is the sales version. What would this mean for the two people on my team who are struggling right now?",
    vagueClaimChallenge:
      "I have heard that phrasing before and it did not survive contact with our billing service. Can you be more specific?",
    closedQuestionResponse:
      "Mm, yes. If you ask me something open I will actually tell you what is going on.",
    layers: [
      {
        topic: "Team situation",
        triggers: ["team", "workflow", "today", "process", "how does", "structure"],
        reveal:
          "Six engineers, Kanban, reviews by whoever is free. Two of the six joined six weeks ago.",
        covers: ["situation"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Onboarding difficulty",
        triggers: ["onboard", "new", "ramp", "documentation", "understand", "learn", "productive"],
        reveal:
          "The new pair are still asking basic questions about the billing service. Documentation is thin and out of date. Every question routes to Tomas.",
        covers: ["problem"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Key-person risk",
        triggers: ["tomas", "one person", "key person", "bus factor", "only", "expert", "leave"],
        reveal:
          "Tomas is the only person who really knows billing. He is also the person I need on the payment provider migration. And he is interviewing elsewhere, I suspect.",
        covers: ["identifyPain"],
      },
      {
        topic: "Consequence",
        triggers: ["cost", "consequence", "impact", "delay", "what happens", "how much"],
        reveal:
          "Realistically I am getting maybe 60% of the output I planned for this quarter, and Tomas is the bottleneck on everything billing-related.",
        covers: ["implication", "metrics"],
      },
      {
        topic: "Adoption concerns",
        triggers: ["adopt", "resist", "trust", "engineers think", "review burden", "overhead"],
        reveal:
          "If it means my seniors reviewing a pile of machine-generated pull requests, they will refuse, and they will be right to.",
        covers: ["decisionCriteria"],
      },
      {
        topic: "Who decides",
        triggers: ["budget", "approve", "decision", "who else", "manager", "sofia's boss"],
        reveal:
          "Marcus, our VP, would have to sponsor it. I can get you in front of him if my team does not hate it.",
        covers: ["economicBuyer", "decisionProcess"],
      },
    ],
  },
  {
    id: "senior-developer",
    name: "Tomas Berg",
    role: "Senior developer, billing and payments",
    priorities: ["Code quality", "Not being on call for someone else's mess", "Interesting work"],
    hiddenPain:
      "He is the only person who understands the billing service and spends most of his week answering questions and reviewing other people's changes instead of building.",
    currentWorkflow:
      "Reviews most pull requests touching billing, writes the tests others skip, maintains a fragile legacy service.",
    objections: [
      "Our developers can do this themselves",
      "We do not trust autonomous changes",
      "Our codebase is too complex",
    ],
    decisionAuthority: "No budget authority; effective veto through credibility.",
    buyingCriteria: ["Changes must be small and readable", "Must not weaken tests", "Must follow existing patterns"],
    urgency: "low",
    likelyCompetition: ["Doing nothing", "Existing editor assistant"],
    opening:
      "I got pulled into this call. I will tell you now, I have cleaned up after enough generated code to be cynical. Go ahead.",
    pitchPushback:
      "I do not care about the capability list. I care what lands in my review queue on a Friday afternoon.",
    vagueClaimChallenge:
      "That is marketing. Tell me what it actually does and what it does not do.",
    closedQuestionResponse: "No. Next question.",
    layers: [
      {
        topic: "What his week looks like",
        triggers: ["day", "week", "workflow", "time", "spend", "today", "what do you"],
        reveal:
          "Maybe a third of my week is my own work. The rest is reviews and answering questions about billing because I am the only one who knows it.",
        covers: ["situation", "problem"],
        requiresOpenQuestion: true,
      },
      {
        topic: "What he distrusts about generated code",
        triggers: ["trust", "quality", "worry", "concern", "bad", "wrong", "hacky", "review"],
        reveal:
          "It looks right and it is subtly wrong. Hardcoded values, a test weakened so it passes, no error handling. Reviewing that is slower than writing it myself.",
        covers: ["problem", "decisionCriteria"],
        requiresOpenQuestion: true,
      },
      {
        topic: "What would change his mind",
        triggers: ["convince", "change your mind", "need to see", "evidence", "proof", "comfortable", "trust it"],
        reveal:
          "A small change. Follows the pattern of the file next to it. Tests run, output shown, and no test touched to make it pass. If I saw that on a real ticket I would be interested despite myself.",
        covers: ["decisionCriteria"],
      },
      {
        topic: "Tedious work he would hand over",
        triggers: ["tedious", "boring", "repetitive", "hate", "postpone", "hand off", "give away"],
        reveal:
          "There is a currency-handling cleanup across about forty files. Purely mechanical. I have deferred it for a year because it is soul-destroying.",
        covers: ["identifyPain"],
      },
      {
        topic: "Consequence of being the bottleneck",
        triggers: ["cost", "consequence", "bottleneck", "impact", "what happens", "holiday", "leave"],
        reveal:
          "When I took two weeks off in April, everything billing-related stopped. That is not a good position for me or for them.",
        covers: ["implication"],
      },
    ],
  },
  {
    id: "security-leader",
    name: "Anita Kaur",
    role: "Head of Security",
    priorities: ["Data protection", "Auditable access", "Vendor risk management"],
    hiddenPain:
      "Shadow AI tool usage is already happening across engineering and she has no visibility into it, which is a worse position than a reviewed vendor.",
    currentWorkflow:
      "Vendor security review, data-flow assessment, access review, annual re-certification.",
    objections: [
      "We cannot give an external tool access to our code",
      "AI will create security risk",
      "Procurement will take too long",
    ],
    decisionAuthority: "Veto authority on anything touching source code or customer data.",
    buyingCriteria: [
      "Documented data handling",
      "Least-privilege repository access",
      "Auditable change trail",
    ],
    urgency: "low",
    likelyCompetition: ["Doing nothing", "Self-hosted alternatives"],
    opening:
      "I am here because engineering asked me to be. My default answer to new code access is no, so treat this as your chance to change that.",
    pitchPushback:
      "Productivity is not my remit. I need to understand data flow and access scope.",
    vagueClaimChallenge:
      "Certifications are table stakes, not an answer. I asked about a specific control.",
    closedQuestionResponse: "Correct. Please ask a real question.",
    layers: [
      {
        topic: "Her review process",
        triggers: ["process", "review", "requirement", "assessment", "how do you", "vendor", "steps"],
        reveal:
          "Vendor security review, data-flow assessment, access review, then an annual re-check. Six to eight weeks if the vendor is responsive.",
        covers: ["paperProcess", "decisionProcess"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Specific concerns",
        triggers: ["concern", "worry", "risk", "data", "access", "scope", "exposure", "secret"],
        reveal:
          "Scope of repository access, whether code or secrets leave our boundary, retention, and whether every action is attributable in an audit.",
        covers: ["decisionCriteria"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Shadow AI usage",
        triggers: ["already", "existing", "shadow", "other tools", "current usage", "visibility"],
        reveal:
          "Off the record: I am fairly sure half of engineering is pasting code into consumer AI tools already. A reviewed vendor with scoped access is a better position than that, which is the only reason I am in this meeting.",
        covers: ["identifyPain", "competition"],
      },
      {
        topic: "What would let this proceed",
        triggers: ["proceed", "approve", "need", "documentation", "requirement", "unblock", "comfortable"],
        reveal:
          "Documented data handling, least-privilege access scoped to specific repositories, and an audit trail of every change. Start that paperwork now, not after the pilot.",
        covers: ["decisionCriteria", "paperProcess"],
      },
      {
        topic: "Consequence of delay",
        triggers: ["timeline", "how long", "delay", "consequence", "if we wait", "parallel"],
        reveal:
          "If you wait for engineering to finish evaluating before starting with me, you have added two months to your timeline. That is entirely self-inflicted.",
        covers: ["implication", "compellingEvent"],
      },
    ],
  },
  {
    id: "platform-leader",
    name: "Priya Nandakumar",
    role: "Platform and infrastructure lead",
    priorities: ["Pipeline reliability", "Developer experience", "Reducing toil"],
    hiddenPain:
      "She personally runs a monthly dependency-upgrade round and a flaky-test triage rotation that nobody else will touch.",
    currentWorkflow:
      "Owns CI/CD, monthly dependency upgrades, quarterly platform migrations, on-call rotation.",
    objections: ["Our developers can do this themselves", "The ROI is unclear"],
    decisionAuthority: "Influences tooling decisions strongly; small discretionary budget.",
    buyingCriteria: ["Handles repetitive work reliably", "Does not add pipeline noise", "Repeatable"],
    urgency: "medium",
    likelyCompetition: ["Internal scripts", "Doing nothing"],
    opening:
      "I own our pipeline and most of the work nobody else wants. If you are going to tell me about AI writing features, I am the wrong audience.",
    pitchPushback:
      "Features are not my problem. Toil is my problem. Ask me about toil.",
    vagueClaimChallenge:
      "I have written scripts that made that claim and then broke. What is different?",
    closedQuestionResponse: "Yes. That did not get either of us very far, did it?",
    layers: [
      {
        topic: "What she owns",
        triggers: ["own", "workflow", "today", "responsib", "platform", "pipeline", "what do you"],
        reveal:
          "CI/CD, the monthly dependency upgrade round, flaky test triage, and quarterly migrations. Plus on-call.",
        covers: ["situation"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Repetitive toil",
        triggers: ["toil", "repetitive", "monthly", "manual", "same", "routine", "tedious", "recurring"],
        reveal:
          "The upgrade round is three days a month of the same steps. Flaky test triage is another two. It is five days a month I do not get back.",
        covers: ["problem", "metrics"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Consequence",
        triggers: ["cost", "consequence", "impact", "instead", "what would you", "opportunity"],
        reveal:
          "Two months a year of my time. The build-time work that would speed up all sixty engineers never gets started because of it.",
        covers: ["implication"],
      },
      {
        topic: "Why scripts failed",
        triggers: ["script", "automate", "already tried", "tooling", "why not", "yourselves"],
        reveal:
          "We automated the easy 70%. The remaining 30% varies just enough that scripts break, and then debugging the script costs more than doing it by hand.",
        covers: ["competition", "problem"],
      },
      {
        topic: "What would convince her",
        triggers: ["convince", "proof", "evidence", "need to see", "trial", "repeatable"],
        reveal:
          "Do one upgrade round end to end, with the pull requests reviewable, and then show me it runs the same way the following month without me rebuilding it.",
        covers: ["decisionCriteria"],
      },
    ],
  },
  {
    id: "procurement",
    name: "Neil Foster",
    role: "Procurement manager",
    priorities: ["Contract terms", "Vendor consolidation", "Defensible pricing"],
    hiddenPain:
      "He is measured on cycle time and on avoiding renewals nobody uses; last year two engineering tools went unused after purchase.",
    currentWorkflow:
      "Intake form, security review coordination, legal redlines, three-quote comparison for new categories.",
    objections: ["Procurement will take too long", "The ROI is unclear"],
    decisionAuthority: "Owns the process, not the decision. Can stop or accelerate everything.",
    buyingCriteria: ["Standard terms", "Documented business case", "Named internal owner"],
    urgency: "low",
    likelyCompetition: ["Existing vendor consolidation", "Doing nothing"],
    opening:
      "I have your intake form. Before we talk commercials I need to know who owns this internally and what the business case says.",
    pitchPushback:
      "I am not the person to persuade about the technology. Tell me about the process and the owner.",
    vagueClaimChallenge:
      "I cannot put that in a business case. I need a number with a source.",
    closedQuestionResponse: "Yes, that is on the form already.",
    layers: [
      {
        topic: "The process",
        triggers: ["process", "steps", "how long", "intake", "legal", "stages", "timeline"],
        reveal:
          "Intake, security review, legal redlines, then approval. New vendor categories also need a comparison. Eight to twelve weeks typically.",
        covers: ["paperProcess", "decisionProcess"],
        requiresOpenQuestion: true,
      },
      {
        topic: "What slows it down",
        triggers: ["slow", "delay", "bottleneck", "stuck", "longest", "problem", "friction"],
        reveal:
          "Security review, and vendors who send documentation late. If the business case is vague, it also sits in a queue behind things that are not.",
        covers: ["problem"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Shelfware history",
        triggers: ["unused", "shelf", "last year", "renewal", "adoption", "waste", "history"],
        reveal:
          "Two engineering tools last year were barely used at renewal. I got asked about both. So I now want a named owner and a metric before I push anything through.",
        covers: ["identifyPain", "decisionCriteria"],
      },
      {
        topic: "How to accelerate",
        triggers: ["accelerate", "parallel", "faster", "start now", "help", "speed"],
        reveal:
          "Send security documentation before the technical evaluation finishes, and give me one sentence of business case with a number in it. That genuinely takes weeks out.",
        covers: ["paperProcess", "metrics"],
      },
    ],
  },
  {
    id: "cfo",
    name: "Helen Marsh",
    role: "CFO / economic buyer",
    priorities: ["Cost discipline", "Capacity without headcount", "Defensible spend"],
    hiddenPain:
      "She imposed the hiring freeze but is being held to the same product commitments by the board.",
    currentWorkflow:
      "Quarterly budget reviews, business cases with a named metric, twelve-month payback expectation.",
    objections: ["The ROI is unclear", "This sounds like replacing engineers"],
    decisionAuthority: "Final budget approval.",
    buyingCriteria: ["A metric that already exists", "Payback within a year", "No hidden internal cost"],
    urgency: "medium",
    likelyCompetition: ["Doing nothing", "Contractors", "Reprioritizing the roadmap"],
    opening:
      "I have fifteen minutes and I am not technical. Tell me what problem this solves and how I would know it worked.",
    pitchPushback:
      "That is engineering detail. I need the business version.",
    vagueClaimChallenge:
      "Percentage productivity claims do not survive my board. Give me something I can source.",
    closedQuestionResponse: "Yes. And?",
    layers: [
      {
        topic: "Her constraints",
        triggers: ["constraint", "priority", "situation", "budget", "freeze", "board", "today"],
        reveal:
          "I froze hiring in engineering. The board did not move the commitments. So I am looking for capacity that does not add headcount.",
        covers: ["situation", "compellingEvent"],
        requiresOpenQuestion: true,
      },
      {
        topic: "What she will accept as evidence",
        triggers: ["metric", "measure", "roi", "evidence", "know it worked", "number", "payback"],
        reveal:
          "Something we already measure. Engineer-hours on repetitive work, or delivery dates hit versus committed. Not a productivity percentage from a vendor study.",
        covers: ["metrics", "decisionCriteria"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Headcount framing",
        triggers: ["headcount", "replace", "jobs", "reduce", "layoff", "team"],
        reveal:
          "To be clear, I am not looking to cut engineers. I am looking to stop missing commitments with the team I have. If your pitch is redundancies, my CTO will stop listening and so will I.",
        covers: ["identifyPain"],
      },
      {
        topic: "Approval process",
        triggers: ["approve", "process", "next step", "decision", "sign", "who else"],
        reveal:
          "My CTO brings me a case with a number and an owner. If those are there, this is a short conversation.",
        covers: ["decisionProcess", "economicBuyer"],
      },
    ],
  },
  {
    id: "friendly-low-authority",
    name: "Jamie Ellis",
    role: "Developer advocate, enthusiastic but no authority",
    priorities: ["Trying new tools", "Being helpful", "Internal visibility"],
    hiddenPain:
      "Nobody senior has asked for this, and Jamie has previously championed a tool that was never approved.",
    currentWorkflow: "Reads about tooling, runs internal demos, files requests that stall.",
    objections: ["Procurement will take too long"],
    decisionAuthority: "None. Genuine enthusiasm, no budget, limited influence.",
    buyingCriteria: ["Easy to try", "Something to show internally"],
    urgency: "low",
    likelyCompetition: ["Doing nothing"],
    opening:
      "I love this stuff, I have been following Devin for ages. Tell me everything — I would really like to get this in here.",
    pitchPushback:
      "Honestly, you can pitch me all you like, I am already sold. That is sort of the problem.",
    vagueClaimChallenge:
      "Ooh, do you have something I could show internally to back that up?",
    closedQuestionResponse: "Yep, definitely!",
    layers: [
      {
        topic: "His actual influence",
        triggers: ["decision", "budget", "approve", "who else", "authority", "own", "sponsor"],
        reveal:
          "Realistically? None. I can get people in a room, but I cannot make anyone act. I championed a testing tool last year and it died in procurement.",
        covers: ["economicBuyer", "decisionProcess"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Who actually feels pain",
        triggers: ["pain", "problem", "who feels", "struggle", "team", "frustrat", "complain"],
        reveal:
          "The platform team complains loudest — Priya spends days a month on upgrades. And Sofia's team is stuck on the billing service.",
        covers: ["identifyPain", "champion"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Whether anyone senior asked",
        triggers: ["asked", "priority", "mandate", "senior", "leadership", "sponsor", "initiative"],
        reveal:
          "Nobody senior asked for this, no. That is the honest answer. It is my idea.",
        covers: ["compellingEvent", "competition"],
      },
      {
        topic: "Getting to the right people",
        triggers: ["introduce", "meeting", "connect", "next step", "who should", "access"],
        reveal:
          "I could get you 30 minutes with Marcus, our VP, if you had something concrete about the platform toil. He responds to specifics, not demos.",
        covers: ["decisionProcess", "champion"],
      },
    ],
  },
  {
    id: "existing-tool-advocate",
    name: "Ravi Menon",
    role: "Staff engineer, advocate for their current AI assistant",
    priorities: ["Not adding tools", "Consistency", "Protecting the workflow he built"],
    hiddenPain:
      "The tool he championed helps with typing but has not touched the review queue or the untouched backlog, and he knows it.",
    currentWorkflow: "Editor-based AI assistant across the team, strong review culture.",
    objections: ["We already use Copilot", "Our developers can do this themselves"],
    decisionAuthority: "None formally; high influence as the incumbent tool's champion.",
    buyingCriteria: ["Must not overlap with the existing tool", "Must not fragment the workflow"],
    urgency: "low",
    likelyCompetition: ["The incumbent AI assistant", "Doing nothing"],
    opening:
      "I set up our current AI tooling, and adoption is good. I am not sure what adding another one buys us.",
    pitchPushback:
      "You are describing overlap with what we already have. Try again.",
    vagueClaimChallenge:
      "More autonomous is a slogan. What work does it do that mine does not?",
    closedQuestionResponse: "Sure. Was there a question in there?",
    layers: [
      {
        topic: "What the existing tool does well",
        triggers: ["existing", "current", "copilot", "what does", "help", "workflow", "adoption"],
        reveal:
          "It is excellent at completing code while you type, and everyone uses it. Adoption is genuinely high.",
        covers: ["situation", "competition"],
        requiresOpenQuestion: true,
      },
      {
        topic: "Where engineers still take over",
        triggers: ["step in", "take over", "manual", "gap", "still", "does not", "limitation", "where do"],
        reveal:
          "It helps an engineer who is already working on something. It does not pick up a ticket, run our tests, or open a pull request on its own. That whole layer is still fully manual.",
        covers: ["problem"],
        requiresOpenQuestion: true,
      },
      {
        topic: "The untouched backlog",
        triggers: ["backlog", "postponed", "never get to", "tedious", "migration", "untouched"],
        reveal:
          "There is a pile of work nobody starts: the currency cleanup, the reporting migration, flaky test triage. Faster typing has never made a dent in it.",
        covers: ["identifyPain", "implication"],
      },
      {
        topic: "Concern about fragmentation",
        triggers: ["overlap", "fragment", "two tools", "consolidat", "confus", "another tool"],
        reveal:
          "My worry is two tools with unclear boundaries and a team that trusts neither. If you can draw that line clearly, I will listen.",
        covers: ["decisionCriteria"],
      },
    ],
  },
];

export function getPersona(id: string): Persona | undefined {
  return personas.find((p) => p.id === id);
}
