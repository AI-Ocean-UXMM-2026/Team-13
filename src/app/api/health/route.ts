import { wrap } from '@/lib/http';
import { health } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const GET = wrap(health);
export const OPTIONS = wrap(async () => ({}));
