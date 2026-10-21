import { wrap } from '@/lib/http';
import { complete } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const POST = wrap(complete);
export const OPTIONS = wrap(async () => ({}));
