// Run against an isolated local database, never a production student database.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
async function main() {
  const base = process.env.API_BASE_URL || "http://127.0.0.1:3000";
  const sid = randomUUID(),
    other = randomUUID();
  let checks = 0;
  async function request(
    path: string,
    method = "GET",
    data?: unknown,
    status = 200,
    session = sid,
  ) {
    const response = await fetch(base + path, {
      method,
      headers: {
        "x-session-id": session,
        ...(method === "POST" ? { "content-type": "application/json" } : {}),
      },
      body: method === "POST" ? JSON.stringify(data ?? {}) : undefined,
    });
    const json = await response.json();
    assert.equal(
      response.status,
      status,
      `${method} ${path}: ${JSON.stringify(json)}`,
    );
    checks++;
    return json;
  }
  const malformed = await fetch(base + "/api/quiz/complete", {
    method: "POST",
    headers: { "content-type": "application/json", "x-session-id": sid },
    body: "{",
  });
  assert.equal(malformed.status, 400);
  checks++;
  await request("/api/health");
  const { questions } = await request("/api/quiz");
  assert.equal(questions.length, 20);
  assert.equal(JSON.stringify(questions).includes("score"), false);
  const { attemptId } = await request("/api/quiz/start", "POST", {}, 201);
  await request(`/api/results/${attemptId}`, "GET", undefined, 404);
  const answers = questions.map((q: any) => ({
    questionId: q.id,
    optionIds: [q.options[q.position <= 12 ? 3 : 0].id],
  }));
  await request(
    "/api/quiz/complete",
    "POST",
    { attemptId, answers: answers.slice(1) },
    400,
  );
  const wrong = structuredClone(answers);
  wrong[0].optionIds = [questions[1].options[0].id];
  await request(
    "/api/quiz/complete",
    "POST",
    { attemptId, answers: wrong },
    400,
  );
  const unknown = structuredClone(answers);
  unknown[0].questionId = randomUUID();
  await request(
    "/api/quiz/complete",
    "POST",
    { attemptId, answers: unknown },
    400,
  );
  const duplicates = structuredClone(answers);
  duplicates[1] = duplicates[0];
  await request(
    "/api/quiz/complete",
    "POST",
    { attemptId, answers: duplicates },
    400,
  );
  for (const pos of [15, 17]) {
    const a = structuredClone(answers);
    a[pos - 1].optionIds = questions[pos - 1].options
      .slice(0, 3)
      .map((o: any) => o.id);
    await request("/api/quiz/complete", "POST", { attemptId, answers: a }, 400);
  }
  await request(
    "/api/quiz/complete",
    "POST",
    { attemptId, answers },
    404,
    other,
  );
  const complete = await request("/api/quiz/complete", "POST", {
    attemptId,
    answers,
  });
  assert.deepEqual(complete.result.riasec, {
    R: 6,
    I: 9,
    A: 6,
    S: 6,
    E: 6,
    C: 3,
  });
  assert.equal(complete.result.recommendations.length, 18);
  assert.equal(complete.result.areas.length, 6);
  assert.ok(
    complete.result.areas.every(
      (area: any) =>
        area.careers.length === 3 &&
        area.careers.every((career: any) => career.activity.steps.length >= 3),
    ),
  );
  assert.ok(
    complete.result.advisors.every((advisor: any) => !("contact" in advisor)),
  );
  const retry = await request("/api/quiz/complete", "POST", {
    attemptId,
    answers: [...answers].reverse(),
  });
  assert.deepEqual(retry, complete);
  const changed = structuredClone(answers);
  changed[0].optionIds = [questions[0].options[0].id];
  await request(
    "/api/quiz/complete",
    "POST",
    { attemptId, answers: changed },
    409,
  );
  assert.deepEqual(await request(`/api/results/${attemptId}`), complete);
  await request(`/api/results/${attemptId}`, "GET", undefined, 404, other);
  await request(`/api/results/${randomUUID()}`, "GET", undefined, 404);
  const { attemptId: second } = await request(
    "/api/quiz/start",
    "POST",
    {},
    201,
  );
  const again = await request("/api/quiz/complete", "POST", {
    attemptId: second,
    answers,
  });
  assert.deepEqual(again.result, complete.result);
  const category = complete.result.topCategories.join(",");
  const { courses } = await request("/api/courses?category=" + category);
  assert.ok(courses.length);
  await request("/api/courses?category=bad", "GET", undefined, 400);
  const interest = await request(
    `/api/courses/${courses[0].id}/interest`,
    "POST",
  );
  assert.equal(interest.url, courses[0].url);
  await request(`/api/courses/${courses[0].id}/interest`, "POST");
  await request(`/api/courses/${randomUUID()}/interest`, "POST", {}, 404);
  const { advisors } = await request("/api/advisors?category=" + category);
  assert.ok(advisors.length);
  const contact = {
    studentName: "Integration Demo",
    contactMethod: "email",
    contactValue: "integration@example.com",
    consent: true,
  };
  await request(
    `/api/advisors/${advisors[0].id}/leads`,
    "POST",
    { ...contact, consent: false },
    400,
  );
  await request(
    `/api/advisors/${advisors[0].id}/leads`,
    "POST",
    { ...contact, contactValue: "bad" },
    400,
  );
  await request(`/api/advisors/${advisors[0].id}/leads`, "POST", contact, 201);
  const { placements } = await request("/api/ads?category=" + category);
  assert.ok(Object.keys(placements).length);
  assert.ok(
    Object.values(placements)
      .flat()
      .every((a: any) => a.label === "Sponsored" && a.is_sponsored),
  );
  await request("/api/ads", "GET", undefined, 400);
  await request(
    "/api/events",
    "POST",
    { eventName: "results_viewed", attemptId },
    201,
  );
  await request(
    "/api/events",
    "POST",
    { eventName: "course_clicked", entityId: courses[0].id },
    201,
  );
  await request(
    "/api/events",
    "POST",
    { eventName: "advisor_clicked", entityId: advisors[0].id },
    201,
  );
  await request(
    "/api/events",
    "POST",
    {
      eventName: "explore_clicked",
      metadata: { screen: "landing", action: "explore" },
    },
    201,
  );
  for (const eventName of [
    "unknown",
    "quiz_completed",
    "buy_interest",
    "advisor_lead_submitted",
  ])
    await request("/api/events", "POST", { eventName }, 400);
  await request(
    "/api/events",
    "POST",
    { eventName: "results_viewed", attemptId },
    404,
    other,
  );
  await request(
    "/api/events",
    "POST",
    { eventName: "course_clicked", entityId: randomUUID() },
    400,
  );
  await request(
    "/api/events",
    "POST",
    { eventName: "explore_clicked", metadata: { email: "private" } },
    400,
  );
  assert.deepEqual(
    (await request(`/api/results/${attemptId}`)).result,
    complete.result,
  );
  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  try {
    const events = await db
      .from("analytics_events")
      .select("event_name")
      .eq("session_id", sid);
    assert.ifError(events.error);
    const counts = (name: string) =>
      events.data!.filter((e) => e.event_name === name).length;
    assert.equal(counts("quiz_started"), 2);
    assert.equal(counts("quiz_completed"), 2);
    assert.equal(counts("buy_interest"), 1);
    assert.equal(counts("advisor_lead_submitted"), 1);
    for (const name of [
      "results_viewed",
      "course_clicked",
      "advisor_clicked",
      "explore_clicked",
    ])
      assert.equal(counts(name), 1);
    for (const table of ["course_interests", "advisor_leads"]) {
      const r = await db.from(table).select("*").eq("session_id", sid);
      assert.ifError(r.error);
      assert.equal(r.data!.length, 1);
    }
    console.log(
      `PASS: ${checks} HTTP assertions; full 20-question flow, ownership, idempotency, course interest, consent, ads, all 8 event types, and database records verified.`,
    );
  } finally {
    const cleanup = await db
      .from("anonymous_sessions")
      .delete()
      .in("id", [sid, other]);
    assert.ifError(cleanup.error);
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
