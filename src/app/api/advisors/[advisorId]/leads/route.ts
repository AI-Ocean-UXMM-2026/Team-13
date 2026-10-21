import { wrap } from '@/lib/http';
import { lead } from '@/lib/service';
export const dynamic = 'force-dynamic';
export async function POST(req: Request, context: {
    params: Promise<{
        advisorId: string;
    }>;
}) { const { advisorId } = await context.params; return wrap(r => lead(r, advisorId), 201)(req); }
export const OPTIONS = wrap(async () => ({}));
