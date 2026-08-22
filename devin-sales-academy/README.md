# Devin Sales Academy

A practice app for sellers without an engineering background. It teaches software
engineering and Devin in plain English, then grades practice against buyers who
push back.

The loop: **learn → practise → get graded → understand why → try again → track improvement.**

Live: https://amylyn95-jpg.github.io/Battleship-V1/academy/ (published by the Pages
workflow on every push to `main`; the app is exported as static files, so there is
no server and progress stays in your browser)

## What is in it

| Page | What it does |
| --- | --- |
| `/learn` | Five modules: engineering fundamentals, Devin fundamentals, SPIN, MEDDICCC, CTO empathy |
| `/lesson/[id]` | A lesson with a plain-English definition, why a CTO cares, the Devin connection, a misconception, a knowledge check, and a question to ask a customer |
| `/quiz/[id]` | Multiple choice, select-all, ranking, "which SPIN/MEDDICCC element is this", and free-text answers with rubric grading |
| `/roleplay` | Ten buyers who reveal their real pain only if you ask open questions about things they care about |
| `/objections` | Answer an objection in your own words, get graded, then see the acknowledge → clarify → ask → evidence framework |
| `/demo-coach` | Describe a customer pain and get a demo recipe, including what the demo does *not* prove |
| `/debrief` | Write up a real call and see which parts of MEDDICCC you actually covered |
| `/progress` | Per-skill scores, trend, weakest areas, and history |

## Grading is deterministic

There is no AI API call and no key to configure. Free-text answers are scored by
a rubric of ten categories (empathy, situation, problem, implication,
need-payoff, MEDDICCC coverage, technical accuracy, relevance, persuasion, next
step) using question/structure detection and keyword lexicons in
`lib/lexicons.ts`. The same answer always produces the same score, which is what
makes "try again and improve" meaningful.

The grader also flags claims that cannot be defended to a technical buyer
("guarantees", "100%", "replaces your engineers", "no review needed"), because
overclaiming is the fastest way to lose an engineering audience.

## Progress

Progress is stored in this browser only (`localStorage`, key
`devin-sales-academy.progress.v1`). There is no login and no server, so a
refresh keeps your progress but a different browser starts fresh. `/progress`
has a reset button.

## Content is data

All teaching content lives in `content/` as typed TypeScript, against the
contracts in `lib/types.ts`. Adding a lesson, quiz question, persona, objection,
or demo recipe means adding an object to an array — no UI changes.

```
content/lessons-a.ts     engineering fundamentals
content/lessons-b.ts     Devin fundamentals
content/lessons-cde.ts   SPIN, MEDDICCC, CTO empathy
content/quizzes.ts       quizzes
content/personas.ts      role-play buyers and their reveal layers
content/objections.ts    objections and their frameworks
content/demos.ts         demo recipes
```

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # grader and content-integrity tests
npm run lint
npm run build
```
