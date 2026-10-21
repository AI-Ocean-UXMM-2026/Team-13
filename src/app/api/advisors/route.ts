import { wrap } from '@/lib/http';
import { advisors } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const GET = wrap(advisors);
export const OPTIONS = wrap(async () => ({}));
