import { wrap } from '@/lib/http';
import { interest } from '@/lib/service';
export const dynamic = 'force-dynamic';
export async function POST(req: Request, context: {
    params: Promise<{
        courseId: string;
    }>;
}) { const { courseId } = await context.params; return wrap(r => interest(r, courseId))(req); }
export const OPTIONS = wrap(async () => ({}));
