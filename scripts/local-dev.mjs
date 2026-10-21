import { spawn, spawnSync } from "node:child_process";
import { chmod, stat, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { localConfig } from "./local-config.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const children = new Set();
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill("SIGTERM");
}

function launch(command, args, env = process.env) {
  const child = spawn(command, args, { cwd: root, env, stdio: "inherit" });
  children.add(child);
  child.once("error", (error) => {
    console.error(`Could not start ${command}: ${error.message}`);
    stop(1);
  });
  child.once("exit", (code) => {
    children.delete(child);
    if (!stopping) stop(code ?? 1);
  });
  return child;
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

try {
  // PostgreSQL initialization runs as a container user, so its SQL must be readable.
  for (const path of [
    "scripts/local-roles.sql",
    "supabase/migrations/202610210001_initial.sql",
    "supabase/seed.sql",
    "supabase/migrations/202610210002_frontend.sql",
    "supabase/demo_enrichment.sql",
  ]) {
    const fullPath = new URL(`../${path}`, import.meta.url);
    const info = await stat(fullPath);
    await chmod(fullPath, info.mode | 0o444);
  }
  const docker = spawn("docker", ["compose", "up", "-d", "--wait"], {
    cwd: root,
    stdio: "inherit",
  });
  children.add(docker);
  const code = await new Promise((resolve, reject) => {
    docker.once("error", reject);
    docker.once("exit", resolve);
  });
  children.delete(docker);
  if (code !== 0)
    throw new Error("Start Docker Desktop, then retry npm run dev:local.");
  if (!stopping) {
    for (const path of [
      "supabase/migrations/202610210002_frontend.sql",
      "supabase/demo_enrichment.sql",
    ]) {
      const result = spawnSync(
        "docker",
        [
          "compose",
          "exec",
          "-T",
          "postgres",
          "psql",
          "-U",
          "postgres",
          "-v",
          "ON_ERROR_STOP=1",
        ],
        {
          cwd: root,
          input: await readFile(new URL(`../${path}`, import.meta.url)),
          encoding: "utf8",
        },
      );
      if (result.status !== 0)
        throw new Error(
          `Database upgrade failed: ${result.stderr || result.error?.message || path}`,
        );
    }
    launch(process.execPath, ["scripts/local-gateway.mjs"]);
    launch(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "dev",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3000",
      ],
      {
        ...process.env,
        ...localConfig,
      },
    );
    console.log("Local API: http://localhost:3000/api/health");
    console.log(
      "Ctrl+C stops the API and gateway. Database data is retained; npm run db:stop stops Docker services.",
    );
  }
} catch (error) {
  console.error(error.message);
  stop(1);
}
