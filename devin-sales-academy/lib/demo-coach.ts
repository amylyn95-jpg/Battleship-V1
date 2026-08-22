import { demoRecipes } from "@/content/demos";
import { analyzeText } from "./grading";
import type { DemoRecipe } from "./types";

export interface DemoMatch {
  recipe: DemoRecipe;
  /** Number of pain keywords found in the learner's description. */
  hits: string[];
  score: number;
}

export function matchDemos(painDescription: string, limit = 3): DemoMatch[] {
  const { normalized } = analyzeText(painDescription);
  return demoRecipes
    .map((recipe) => {
      const hits = recipe.painKeywords.filter((k) => normalized.includes(k));
      return { recipe, hits, score: hits.length };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function fallbackDemos(limit = 3): DemoRecipe[] {
  return demoRecipes.slice(0, limit);
}
