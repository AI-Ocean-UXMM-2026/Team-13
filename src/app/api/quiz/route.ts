import { wrap } from '@/lib/http';
import { getQuiz } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const GET = wrap(getQuiz);
export const OPTIONS = wrap(async () => ({}));
