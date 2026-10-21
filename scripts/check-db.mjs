// Read-only checks against the configured database. Never print URLs, keys, or student rows.
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the server environment or .env.local.",
  );
  process.exitCode = 1;
} else {
  const client = createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, options) =>
        fetch(input, { ...options, signal: AbortSignal.timeout(12000) }),
    },
  });
  const checks = [
    ["career_categories", "id", 6],
    ["quiz_questions", "id,max_selections", 20],
    ["quiz_options", "id,question_id"],
    ["quiz_attempts", "entry_reason"],
    ["course_interests", "attempt_id"],
    ["advisor_leads", "attempt_id"],
    ["career_roles", "suggested_next_step"],
    ["advisors", "summary"],
    ["ads", "summary,provider_name"],
    ["write_receipts", "session_id"],
    ["app_migrations", "version"],
  ];
  let failures = 0;
  const results = await Promise.allSettled(
    checks.map(async ([table, columns, count]) => {
      let query = client
        .from(table)
        .select(columns, { count: "exact" })
        .limit(0);
      if (count !== undefined) query = query.eq("is_active", true);
      if (table === "app_migrations")
        query = query.eq("version", "202610210002");
      const result = await query;
      if (result.error) {
        failures++;
        return `FAIL ${table} (${result.status === 0 ? "network unavailable" : result.status === 401 || result.status === 403 ? "access denied" : result.error.code || "query failed"})`;
      }
      if (table === "app_migrations" && result.count !== 1) {
        failures++;
        return "FAIL frontend migration version marker is missing";
      }
      if (count !== undefined && result.count !== count) {
        failures++;
        return `FAIL ${table}: expected ${count} active records; received ${result.count}`;
      }
      return `PASS ${table}${count !== undefined ? `: ${result.count} active records` : ""}`;
    }),
  );
  for (const result of results) {
    if (result.status === "fulfilled") console.log(result.value);
    else {
      failures++;
      console.log("FAIL a schema check could not connect");
    }
  }
  try {
    const response = await fetch(new URL("/rest/v1/", url), {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(12000),
    });
    const schema = await response.json();
    if (response.ok && schema.paths) {
      for (const name of ["frontend_write", "complete_quiz"]) {
        const found = !!schema.paths[`/rpc/${name}`];
        console.log(`${found ? "PASS" : "FAIL"} function ${name}`);
        if (!found) failures++;
      }
    } else {
      console.log("FAIL function metadata unavailable");
      failures++;
    }
  } catch {
    console.log("FAIL function metadata could not be reached");
    failures++;
  }
  if (failures) {
    console.log("\nDatabase is not ready. No data or schema was changed.");
    console.log(
      "For missing frontend fields/functions: review and apply supabase/migrations/202610210002_frontend.sql, then supabase/demo_enrichment.sql.",
    );
    console.log(
      "For connection/access failures: check the network and server environment privately.",
    );
    process.exitCode = 1;
  } else
    console.log("\nDatabase schema checks passed. No writes were performed.");
}
