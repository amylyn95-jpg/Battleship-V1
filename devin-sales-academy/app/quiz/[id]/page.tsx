import { notFound } from "next/navigation";
import { QuizRunner } from "@/components/quiz-runner";
import { getQuiz, quizzes } from "@/content";

export function generateStaticParams() {
  return quizzes.map((quiz) => ({ id: quiz.id }));
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = getQuiz(id);
  if (!quiz) notFound();

  return <QuizRunner quiz={quiz} />;
}
