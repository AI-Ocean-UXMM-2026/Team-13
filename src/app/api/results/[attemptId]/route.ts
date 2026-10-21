import { wrap } from '@/lib/http';
import { results } from '@/lib/service';
export const dynamic = 'force-dynamic';
export async function GET(req: Request, context: {
    params: Promise<{
        attemptId: string;
    }>;
}) { const { attemptId } = await context.params; return wrap(r => results(r, attemptId))(req); }
export const OPTIONS = wrap(async () => ({}));
