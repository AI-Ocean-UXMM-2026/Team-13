import Options from "@/components/options";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { attemptId } = await params;
  const { category } = await searchParams;
  return (
    <Options
      attemptId={attemptId}
      initialCategory={typeof category === "string" ? category : undefined}
    />
  );
}
