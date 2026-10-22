import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const sid = crypto.randomUUID(),
  other = crypto.randomUUID();
const base = process.env.API_BASE_URL ?? "http://127.0.0.1:3000";
async function request(
  path: string,
  payload?: unknown,
  key?: string,
  session = sid,
) {
  const response = await fetch(base + path, {
    method: payload === undefined ? "GET" : "POST",
    headers: {
      "X-Session-ID": session,
      "Content-Type": "application/json",
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  return { status: response.status, json: await response.json() };
}
async function main() {
  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  try {
    const key = crypto.randomUUID(),
      payload = { entryReason: "not_sure_yet" };
    const starts = await Promise.all(
      Array.from({ length: 4 }, () => request("/api/quiz/start", payload, key)),
    );
    assert.ok(
      starts.every(
        (r) =>
          r.status === 201 && r.json.attemptId === starts[0].json.attemptId,
      ),
    );
    assert.equal(
      (
        await request(
          "/api/quiz/start",
          { entryReason: "too_many_interests" },
          key,
        )
      ).status,
      409,
    );
    const attemptId = starts[0].json.attemptId;
    const attempt = await db
      .from("quiz_attempts")
      .select("entry_reason")
      .eq("id", attemptId)
      .single();
    assert.ifError(attempt.error);
    assert.equal(attempt.data!.entry_reason, "not_sure_yet");
    const {
      json: { courses },
    } = await request("/api/courses?category=I");
    const courseId = courses[0].id;
    assert.equal((await request(`/api/courses/${courseId}`)).status, 200);
    assert.equal(
      (await request(`/api/courses/${crypto.randomUUID()}`)).status,
      404,
    );
    const interestKey = crypto.randomUUID();
    const interests = await Promise.all(
      Array.from({ length: 3 }, () =>
        request(
          `/api/courses/${courseId}/interest`,
          { attemptId },
          interestKey,
        ),
      ),
    );
    assert.ok(interests.every((r) => r.status === 200));
    assert.deepEqual(interests[0].json, interests[2].json);
    assert.equal(
      (
        await request(
          `/api/courses/${courseId}/interest`,
          { attemptId },
          crypto.randomUUID(),
          other,
        )
      ).status,
      404,
    );
    const {
      json: { advisors },
    } = await request("/api/advisors?category=I");
    const advisorId = advisors[0].id;
    assert.ok(advisors[0].summary);
    assert.equal(advisors[0].contact, undefined);
    assert.equal((await request(`/api/advisors/${advisorId}`)).status, 200);
    const lead = {
      attemptId,
      studentName: "Fictional Test",
      contactMethod: "email",
      contactValue: "demo@example.com",
      consent: true,
    };
    const leadKey = crypto.randomUUID();
    const leads = await Promise.all(
      Array.from({ length: 3 }, () =>
        request(`/api/advisors/${advisorId}/leads`, lead, leadKey),
      ),
    );
    assert.ok(
      leads.every(
        (r) => r.status === 201 && r.json.leadId === leads[0].json.leadId,
      ),
    );
    assert.equal(
      (
        await request(
          `/api/advisors/${advisorId}/leads`,
          { ...lead, studentName: "Changed" },
          leadKey,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await request(
          `/api/advisors/${advisorId}/leads`,
          lead,
          crypto.randomUUID(),
          other,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await request(
          `/api/advisors/${advisorId}/leads`,
          { ...lead, contactMethod: "telegram" },
          crypto.randomUUID(),
        )
      ).status,
      400,
    );
    for (const table of ["course_interests", "advisor_leads"]) {
      const result = await db
        .from(table)
        .select("attempt_id")
        .eq("session_id", sid);
      assert.ifError(result.error);
      assert.equal(result.data!.length, 1);
      assert.equal(result.data![0].attempt_id, attemptId);
    }
    const events = await db
      .from("analytics_events")
      .select("event_name,attempt_id,metadata")
      .eq("session_id", sid);
    assert.ifError(events.error);
    for (const name of [
      "quiz_started",
      "buy_interest",
      "advisor_lead_submitted",
    ]) {
      assert.equal(events.data!.filter((e) => e.event_name === name).length, 1);
    }
    assert.ok(events.data!.every((e) => e.attempt_id === attemptId));
    assert.equal(
      JSON.stringify(events.data).includes("demo@example.com"),
      false,
    );
    console.log(
      "PASS: concurrent start/interest/lead retry safety, changed-payload conflicts, entry reasons, detail endpoints, attempt linkage, ownership, phone/email restriction, and event privacy.",
    );
  } finally {
    const cleanup = await db
      .from("anonymous_sessions")
      .delete()
      .in("id", [sid, other]);
    assert.ifError(cleanup.error);
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
