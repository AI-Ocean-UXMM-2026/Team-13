import { wrap } from '@/lib/http';
import { event } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const POST = wrap(event, 201);
export const OPTIONS = wrap(async () => ({}));
