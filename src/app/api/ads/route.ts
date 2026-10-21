import { wrap } from '@/lib/http';
import { ads } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const GET = wrap(ads);
export const OPTIONS = wrap(async () => ({}));
