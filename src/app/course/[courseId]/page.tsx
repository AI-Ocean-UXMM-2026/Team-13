import { CourseDetail } from "@/components/details";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { courseId } = await params;
  const { attemptId } = await searchParams;
  return (
    <CourseDetail
      courseId={courseId}
      attemptId={typeof attemptId === "string" ? attemptId : undefined}
    />
  );
}
