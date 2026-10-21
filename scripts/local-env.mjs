// Print shell exports for the local harness. Contains no hosted credentials.
import { createHmac } from 'node:crypto';
const enc=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const input=enc({alg:'HS256',typ:'JWT'})+'.'+enc({role:'service_role',iss:'local-demo'});
const jwt=input+'.'+createHmac('sha256','local-demo-only-signing-key-not-for-production-2026').update(input).digest('base64url');
console.log('export SUPABASE_URL=http://127.0.0.1:54321');
console.log('export SUPABASE_SERVICE_ROLE_KEY='+jwt);
