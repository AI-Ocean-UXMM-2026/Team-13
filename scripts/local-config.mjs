// Public credentials for this repository's isolated Docker database only.
import { createHmac } from 'node:crypto';

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const input = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role: 'service_role', iss: 'local-demo' })}`;
const signature = createHmac('sha256', 'local-demo-only-signing-key-not-for-production-2026')
  .update(input).digest('base64url');

export const localConfig = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY: `${input}.${signature}`,
};
