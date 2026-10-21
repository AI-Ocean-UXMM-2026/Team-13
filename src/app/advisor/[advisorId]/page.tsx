import { AdvisorDetail } from "@/components/details";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ advisorId: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { advisorId } = await params;
  const { attemptId } = await searchParams;
  return (
    <AdvisorDetail
      advisorId={advisorId}
      attemptId={typeof attemptId === "string" ? attemptId : undefined}
    />
  );
}
