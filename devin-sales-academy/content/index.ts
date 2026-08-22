import type { Lesson, ModuleId, ModuleMeta } from "@/lib/types";
import { moduleALessons } from "./lessons-a";
import { moduleBLessons } from "./lessons-b";
import { moduleCLessons, moduleDLessons, moduleELessons } from "./lessons-cde";

export const modules: ModuleMeta[] = [
  {
    id: "A",
    title: "Software engineering fundamentals",
    summary:
      "The twenty concepts you need to follow an engineering conversation, each framed around productivity, risk, cost, or speed.",
  },
  {
    id: "B",
    title: "Devin fundamentals",
    summary:
      "What Devin actually does, described in claims you can defend to a skeptical engineer — including where it is not the right answer.",
  },
  {
    id: "C",
    title: "SPIN selling",
    summary:
      "Situation, Problem, Implication, Need-payoff — and how to stop yourself pitching the moment a problem appears.",
  },
  {
    id: "D",
    title: "MEDDICCC",
    summary:
      "Qualify properly: metrics, economic buyer, decision criteria and process, pain, champion, competition, paper process, compelling event.",
  },
  {
    id: "E",
    title: "CTO empathy",
    summary:
      "The concerns a technical buyer brings into the room, and how to acknowledge them before responding.",
  },
];

export const lessons: Lesson[] = [
  ...moduleALessons,
  ...moduleBLessons,
  ...moduleCLessons,
  ...moduleDLessons,
  ...moduleELessons,
];

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function lessonsForModule(module: ModuleId): Lesson[] {
  return lessons.filter((l) => l.module === module);
}

export function getModule(id: ModuleId): ModuleMeta | undefined {
  return modules.find((m) => m.id === id);
}

export { quizzes, getQuiz } from "./quizzes";
export { personas, getPersona } from "./personas";
export { objections, getObjection } from "./objections";
export { demoRecipes } from "./demos";
