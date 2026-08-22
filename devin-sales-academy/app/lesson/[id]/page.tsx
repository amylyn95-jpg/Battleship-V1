import { notFound } from "next/navigation";
import { LessonView } from "@/components/lesson-view";
import { getLesson, lessons, quizzes } from "@/content";

export function generateStaticParams() {
  return lessons.map((lesson) => ({ id: lesson.id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();

  const index = lessons.findIndex((l) => l.id === lesson.id);
  const next = lessons[index + 1];
  const quiz = quizzes.find((q) => q.module === lesson.module);

  return (
    <LessonView
      lesson={lesson}
      next={next ? { id: next.id, title: next.title } : undefined}
      quizHref={quiz ? `/quiz/${quiz.id}` : undefined}
    />
  );
}
