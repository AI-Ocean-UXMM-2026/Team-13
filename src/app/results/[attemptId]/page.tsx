import Results from "@/components/results";
export default async function Page({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <Results attemptId={attemptId} />;
}
