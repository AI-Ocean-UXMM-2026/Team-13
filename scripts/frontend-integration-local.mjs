import { spawn } from "node:child_process";
import { localConfig } from "./local-config.mjs";
const child = spawn(
  process.execPath,
  ["--import", "tsx", "scripts/frontend-integration.ts"],
  { stdio: "inherit", env: { ...process.env, ...localConfig } },
);
child.once("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.once("exit", (code) => {
  process.exitCode = code ?? 1;
});
