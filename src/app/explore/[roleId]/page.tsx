import Explore from "@/components/explore";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ roleId: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { roleId } = await params;
  const { attemptId } = await searchParams;
  return (
    <Explore
      roleId={roleId}
      attemptId={typeof attemptId === "string" ? attemptId : undefined}
    />
  );
}
