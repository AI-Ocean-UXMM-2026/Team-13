import { wrap } from '@/lib/http';
import { start } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const POST = wrap(start, 201);
export const OPTIONS = wrap(async () => ({}));
