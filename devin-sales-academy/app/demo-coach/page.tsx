"use client";

import { useState } from "react";
import { GradeCard, RubricLegend } from "@/components/score";
import { demoRecipes } from "@/content/demos";
import { matchDemos, type DemoMatch } from "@/lib/demo-coach";
import { gradeResponse, type GradeResult } from "@/lib/grading";
import { useProgress } from "@/lib/use-progress";
import type { DemoRecipe, RubricCategory } from "@/lib/types";

const RUBRIC: RubricCategory[] = [
  "relevance",
  "problemDiscovery",
  "implication",
  "technicalAccuracy",
  "nextStep",
];

function RecipeCard({ recipe, hits }: { recipe: DemoRecipe; hits?: string[] }) {
  return (
    <div className="card grid gap-4">
      <div>
        <p className="label">Demo</p>
        <p className="mt-1 font-medium">{recipe.demo}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">For: {recipe.pain}</p>
        {hits && hits.length > 0 && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Matched on: {hits.join(", ")}
          </p>
        )}
      </div>

      <div>
        <p className="label">What it proves</p>
        <p className="prose-body mt-1">{recipe.proves}</p>
      </div>

      <div>
        <p className="label">Set up first</p>
        <ul className="mt-1 grid list-disc gap-1.5 pl-4">
          {recipe.setup.map((item) => (
            <li key={item} className="prose-body">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="label">Run it like this</p>
        <ol className="mt-1 grid list-decimal gap-1.5 pl-4">
          {recipe.steps.map((item) => (
            <li key={item} className="prose-body">
              {item}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <p className="label">Say this while you demo</p>
        <p className="prose-body mt-1 italic">&ldquo;{recipe.narration}&rdquo;</p>
      </div>

      <div className="rounded-lg border border-rose-500/40 p-3">
        <p className="label text-rose-300">What this does not prove</p>
        <ul className="mt-1 grid list-disc gap-1.5 pl-4">
          {recipe.doesNotProve.map((item) => (
            <li key={item} className="prose-body">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="label">Objections you will get</p>
        <ul className="mt-1 grid list-disc gap-1.5 pl-4">
          {recipe.likelyObjections.map((item) => (
            <li key={item} className="prose-body">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="label">Ask this straight after</p>
        <p className="prose-body mt-1 italic">&ldquo;{recipe.followUpQuestion}&rdquo;</p>
      </div>
    </div>
  );
}

export default function DemoCoachPage() {
  const { recordPractice } = useProgress();
  const [pain, setPain] = useState("");
  const [matches, setMatches] = useState<DemoMatch[] | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);

  function build() {
    const found = matchDemos(pain);
    setMatches(found);
    const result = gradeResponse({
      answer: pain,
      rubric: RUBRIC,
      contextKeywords: found.flatMap((m) => m.hits),
      modelAnswer:
        "Their release train is two weeks, review sits with three seniors who are also on-call, and two of four roadmap commitments slipped last quarter because bounded maintenance work never got picked up. I want to show one bounded ticket going from plan to reviewable pull request.",
      nextBestQuestion:
        found[0]?.recipe.followUpQuestion ??
        "Which piece of work would you point at first, and what happens today when nobody picks it up?",
      whyItMatters:
        "A demo built on a pain they described lands. A demo built on features invites them to look for what is missing.",
    });
    setGrade(result);
    recordPractice("demoAttempts", {
      refId: found[0]?.recipe.id ?? "no-match",
      overall: result.overall,
      skills: ["demos", "technicalFluency"],
    });
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <h1 className="text-3xl font-semibold">Demo coach</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Describe the pain the customer actually described — in their words,
          with numbers if you have them. You will get a demo built on that pain,
          and a grade on how usable your description is.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-3">
          <textarea
            className="field min-h-40"
            placeholder="e.g. Bounded maintenance work sits in the backlog for months because the three senior engineers who could do it are on-call, and two roadmap commitments slipped last quarter."
            value={pain}
            onChange={(event) => setPain(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={pain.trim().length === 0}
              onClick={build}
            >
              Build my demo
            </button>
            {matches !== null && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setMatches(null);
                  setGrade(null);
                  setPain("");
                }}
              >
                Start over
              </button>
            )}
          </div>
        </div>
        <RubricLegend categories={RUBRIC} />
      </div>

      {grade && <GradeCard grade={grade} title="How usable your pain description is" />}

      {matches !== null &&
        (matches.length > 0 ? (
          <section className="grid gap-4">
            <h2 className="text-xl font-semibold">
              {matches.length === 1 ? "Your demo" : "Demos that fit"}
            </h2>
            {matches.map((match) => (
              <RecipeCard
                key={match.recipe.id}
                recipe={match.recipe}
                hits={match.hits}
              />
            ))}
          </section>
        ) : (
          <section className="grid gap-4">
            <div className="card border-amber-400/40">
              <p className="label text-amber-300">No pain matched</p>
              <p className="prose-body mt-2">
                Nothing in your description names a specific friction, so there
                is nothing to build a demo on. That is the real finding: go back
                and ask what happens today, what it costs, and who it hurts.
              </p>
            </div>
            <h2 className="text-xl font-semibold">Common demos to study</h2>
            {demoRecipes.slice(0, 2).map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </section>
        ))}
    </div>
  );
}
