// Print shell exports for the local harness. Contains no hosted credentials.
import { localConfig } from './local-config.mjs';
for (const [key, value] of Object.entries(localConfig)) console.log(`export ${key}=${value}`);
