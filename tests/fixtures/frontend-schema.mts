import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Result, Code } from "../../src/lib/types";

const sid = randomUUID(),
  attemptId = randomUUID(),
  key = randomUUID();
const codes: Code[] = ["R", "I", "A", "S", "E", "C"];
const mapping = ["R", "I", "A", "S", "E", "C", "I", "A", "S", "E", "R", "I"];
const categories = codes.map((code) => ({
  id: randomUUID(),
  code,
  name: code,
  description: `Interest ${code}`,
  is_active: true,
}));
const questions = Array.from({ length: 20 }, (_, i) => ({
  id: randomUUID(),
  position: i + 1,
  text: `Question ${i + 1}`,
  max_selections: 1,
  is_active: true,
}));
const context = [
  "many_interests",
  "hands_on_activity",
  "affordability",
  "building_repairing",
  "online_short_courses",
  "exploring",
  "action_plan",
  "try_beginner_activity",
];
const options = questions.flatMap((q, i) =>
  [0, 1].map((n) => ({
    id: randomUUID(),
    question_id: q.id,
    position: n + 1,
    text: n ? "No" : "Yes",
    value: i < 12 ? String(n) : context[i - 12],
    is_active: true,
  })),
);
const weights = questions
  .slice(0, 12)
  .flatMap((q, i) =>
    options
      .filter((o) => o.question_id === q.id)
      .map((o) => ({
        option_id: o.id,
        category_id: categories.find((c) => c.code === mapping[i])!.id,
        score: o.position === 1 ? 3 : 0,
      })),
  );
// The existing schema has neither activity nor display_order on career_roles.
const roles = categories.map((c) => ({
  id: randomUUID(),
  category_id: c.id,
  title: `Career ${c.code}`,
  description: "An existing career",
  suggested_next_step: "Explore this direction",
  is_demo: true,
  is_active: true,
}));
let saved: Result | undefined;
let markerPresent = true;
let schemaFailure: { code: string; status: number } | undefined;
const calls: {
  path: string;
  method: string;
  body?: Record<string, unknown>;
}[] = [];
const schemaQueries: URL[] = [];
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  assert.equal(
    url.origin,
    "https://schema-fixture.invalid",
    "Unexpected external request",
  );
  const path = url.pathname.replace("/rest/v1/", "");
  const body = request.method === "POST" ? await request.json() : undefined;
  calls.push({ path, method: request.method, body });
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  if (path === "app_migrations") {
    schemaQueries.push(url);
    if (schemaFailure)
      return json(
        { code: schemaFailure.code, message: "Test failure" },
        schemaFailure.status,
      );
    // Match the query against only the migration installed on the existing DB.
    const filter = url.searchParams.get("version");
    const count = markerPresent && filter?.includes("202610210002") ? 1 : 0;
    return new Response(null, {
      status: 200,
      headers: { "Content-Range": `*/${count}` },
    });
  }
  if (path === "anonymous_sessions") {
    return request.method === "POST"
      ? new Response(null, { status: 201 })
      : json({ expires_at: "2099-01-01T00:00:00Z" });
  }
  if (path === "rpc/frontend_write") {
    assert.equal(body.p_session, sid);
    assert.equal(body.p_key, key);
    assert.equal(body.p_operation, "start");
    return json({ attemptId });
  }
  if (path === "quiz_attempts") {
    assert.equal(
      request.method,
      "GET",
      "Attempt writes must use the existing RPCs",
    );
    assert.equal(url.searchParams.get("id"), `eq.${attemptId}`);
    assert.equal(url.searchParams.get("session_id"), `eq.${sid}`);
    return json({
      id: attemptId,
      session_id: sid,
      status: saved ? "completed" : "started",
      result_json: saved,
      answers_json: answers,
    });
  }
  if (path === "rpc/complete_quiz") {
    assert.equal(body.p_session, sid);
    assert.equal(body.p_attempt, attemptId);
    saved = body.p_result;
    return json(saved);
  }
  const tables: Record<string, unknown> = {
    quiz_questions: questions,
    quiz_options: options,
    career_categories: categories,
    option_category_scores: weights,
    career_roles: roles,
    courses: [],
    advisors: [],
  };
  if (path in tables) {
    assert.equal(request.method, "GET");
    return json(tables[path]);
  }
  throw new Error(`Unexpected request: ${request.method} ${path}`);
};
const answers = questions.map((q) => ({
  questionId: q.id,
  optionIds: [options.find((o) => o.question_id === q.id)!.id],
}));
const { start, complete, results } = await import("../../src/lib/service");
const { requireFrontendSchema } = await import("../../src/lib/db");
const { wrap } = await import("../../src/lib/http");
const request = (path: string, body: unknown) =>
  new Request(`https://app-fixture.invalid${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-ID": sid,
      "Idempotency-Key": key,
    },
    body: JSON.stringify(body),
  });

const started = await wrap(
  start,
  201,
)(request("/api/quiz/start", { entryReason: "not_sure_yet" }));
assert.equal(started.status, 201, await started.clone().text());
assert.deepEqual(await started.json(), { attemptId });
assert.equal(calls.filter((c) => c.path === "rpc/frontend_write").length, 1);

const completed = await wrap(complete)(
  request("/api/quiz/complete", { attemptId, answers }),
);
assert.equal(completed.status, 200, await completed.clone().text());
const result = (await completed.json()).result as Result;
assert.equal(result.areas.length, 6);
assert.equal(result.recommendations.length, 6);
assert.ok(
  result.recommendations.every(
    (r) => r.activity === undefined && r.display_order === undefined,
  ),
);
assert.equal(calls.filter((c) => c.path === "rpc/complete_quiz").length, 1);
const restored = await results(request("/api/results", {}), attemptId);
assert.deepEqual(restored.result, result);
assert.ok(
  schemaQueries.every(
    (q) => q.searchParams.get("version") === "eq.202610210002",
  ),
  "Optional catalog migrations must not gate existing quiz operations",
);

markerPresent = false;
const before = calls.length;
const unavailable = await wrap(start, 201)(request("/api/quiz/start", {}));
assert.equal(unavailable.status, 503);
assert.equal((await unavailable.json()).error.code, "SCHEMA_NOT_READY");
assert.ok(
  calls.slice(before).every((c) => c.method === "HEAD"),
  "Missing base schema must be rejected before writes",
);

for (const [code, status, expected] of [
  ["PGRST205", 404, "SCHEMA_NOT_READY"],
  ["42501", 403, "DATABASE_ACCESS_DENIED"],
] as const) {
  schemaFailure = { code, status };
  await assert.rejects(requireFrontendSchema, { code: expected });
}
console.log(
  "Existing-schema start, completion, result read, RPC linkage, optional fields, and readiness failures passed. No database contacted.",
);
