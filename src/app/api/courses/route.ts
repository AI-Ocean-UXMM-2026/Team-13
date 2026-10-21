import { wrap } from '@/lib/http';
import { courses } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const GET = wrap(courses);
export const OPTIONS = wrap(async () => ({}));
