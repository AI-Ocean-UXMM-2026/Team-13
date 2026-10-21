import { wrap } from "@/lib/http";
import { advisorDetail } from "@/lib/service";
export const dynamic = "force-dynamic";
export async function GET(
  req: Request,
  context: { params: Promise<{ advisorId: string }> },
) {
  const { advisorId } = await context.params;
  return wrap((r) => advisorDetail(r, advisorId))(req);
}
export const OPTIONS = wrap(async () => ({}));
