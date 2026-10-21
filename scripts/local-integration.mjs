import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { localConfig } from './local-config.mjs';

// Force the disposable local database, regardless of any hosted shell credentials.
const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/integration.ts'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  env: { ...process.env, ...localConfig, API_BASE_URL: 'http://127.0.0.1:3000' },
  stdio: 'inherit',
});
child.once('error', error => { console.error(error.message); process.exitCode = 1; });
child.once('exit', code => { process.exitCode = code ?? 1; });
