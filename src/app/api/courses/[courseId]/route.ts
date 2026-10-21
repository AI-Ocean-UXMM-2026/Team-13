import { wrap } from "@/lib/http";
import { courseDetail } from "@/lib/service";
export const dynamic = "force-dynamic";
export async function GET(
  req: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await context.params;
  return wrap((r) => courseDetail(r, courseId))(req);
}
export const OPTIONS = wrap(async () => ({}));
