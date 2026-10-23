import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("quiz routes work with the existing frontend schema and retain readiness protections", () => {
  // Exercise the server-only modules in a separate process, with every database
  // request intercepted. This test never contacts or changes a database.
  const result = spawnSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      "tests/fixtures/frontend-schema.mts",
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        SUPABASE_URL: "https://schema-fixture.invalid",
        SUPABASE_SERVICE_ROLE_KEY: "test-only-key",
      },
    },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
