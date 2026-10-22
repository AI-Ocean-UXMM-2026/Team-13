import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { interestMascots } from "../src/lib/frontend/interest-mascots";
import { api, RequestError, track } from "../src/lib/frontend/api";
import {
  DRAFT_LIFETIME,
  compatibleDraft,
  parseDraft,
  save,
  sessionId,
  startKey,
  toggleSelection,
  validSelection,
  type Draft,
} from "../src/lib/frontend/storage";
import {
  safeExternalUrl,
  type PublicQuestion,
} from "../src/lib/frontend/contracts";
const sid = crypto.randomUUID(),
  qid = crypto.randomUUID(),
  a = crypto.randomUUID(),
  b = crypto.randomUUID(),
  c = crypto.randomUUID();
const question: PublicQuestion = {
  id: qid,
  position: 15,
  text: "Choose",
  maxSelections: 2,
  options: [a, b, c].map((id, position) => ({
    id,
    position,
    text: String(position),
    value: String(position),
  })),
};
const draft: Draft = {
  schemaVersion: 1,
  sessionId: sid,
  attemptId: crypto.randomUUID(),
  entryReason: "not_sure_yet",
  questionIds: [qid],
  answers: { [qid]: [a, b] },
  currentQuestionIndex: 0,
  updatedAt: Date.now(),
};
test("mascot matching follows answer identity and rejects incomplete or unrelated scales", () => {
  const scale: PublicQuestion = {
    ...question,
    maxSelections: 1,
    options: [
      ["0", "Not interested"],
      ["1", "A little interested"],
      ["2", "Interested"],
      ["3", "Very interested"],
    ].map(([value, text], position) => ({
      id: crypto.randomUUID(),
      position,
      value,
      text,
    })),
  };
  const reordered = { ...scale, options: [...scale.options].reverse() };
  assert.deepEqual(interestMascots(reordered), interestMascots(scale));
  assert.equal(
    interestMascots(reordered)?.get(scale.options[2].id),
    "/mascots/quiz/neutral.svg",
  );
  assert.equal(interestMascots({ ...scale, maxSelections: 2 }), undefined);
  assert.equal(
    interestMascots({ ...scale, options: scale.options.slice(1) }),
    undefined,
  );
  assert.equal(
    interestMascots({
      ...scale,
      options: scale.options.map((option) => ({ ...option, text: "Other" })),
    }),
    undefined,
  );
  assert.equal(
    interestMascots({
      ...scale,
      options: scale.options.map((option) => ({ ...option, value: "0" })),
    }),
    undefined,
  );
});
test("draft restoration rejects expiry, wrong session, wrong schema, malformed JSON, and changed options", () => {
  assert.deepEqual(parseDraft(JSON.stringify(draft), sid), draft);
  assert.equal(
    parseDraft(JSON.stringify(draft), sid, draft.updatedAt + DRAFT_LIFETIME),
    null,
  );
  assert.equal(parseDraft(JSON.stringify(draft), crypto.randomUUID()), null);
  assert.equal(
    parseDraft(JSON.stringify({ ...draft, schemaVersion: 2 }), sid),
    null,
  );
  assert.equal(parseDraft("{", sid), null);
  assert.equal(compatibleDraft(draft, [question]), true);
  assert.equal(
    compatibleDraft({ ...draft, answers: { [qid]: [crypto.randomUUID()] } }, [
      question,
    ]),
    false,
  );
  assert.equal(
    compatibleDraft({ ...draft, currentQuestionIndex: 2 }, [question]),
    false,
  );
});
test("multi-selection limits preserve prior selections; invalid and duplicate answers cannot advance", () => {
  assert.deepEqual(toggleSelection(question, [a], b), [a, b]);
  assert.deepEqual(toggleSelection(question, [a, b], c), [a, b]);
  assert.deepEqual(toggleSelection(question, [a, b], a), [b]);
  assert.equal(validSelection(question, []), false);
  assert.equal(validSelection(question, [a, b]), true);
  assert.equal(validSelection(question, [a, a]), false);
  assert.equal(validSelection(question, [crypto.randomUUID()]), false);
  assert.deepEqual(toggleSelection({ ...question, maxSelections: 1 }, [a], b), [
    b,
  ]);
});
test("session creation and pending start keys work without browser storage", () => {
  save("career.session", "invalid");
  const current = sessionId();
  assert.equal(z.uuid().safeParse(current).success, true);
  assert.equal(sessionId(), current);
  const key = startKey("not_sure_yet");
  assert.equal(startKey("not_sure_yet"), key);
  assert.notEqual(startKey("too_many_interests"), key);
});
test("outbound navigation accepts only HTTP(S) URLs without embedded credentials", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "https://user:pass@example.com",
    null,
  ])
    assert.equal(safeExternalUrl(value), null);
  assert.equal(
    safeExternalUrl("https://example.com/course"),
    "https://example.com/course",
  );
});
test("API handles non-JSON errors, ownership failure, and schema drift without displaying raw responses", async (ctx) => {
  const original = globalThis.fetch;
  ctx.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async () =>
    new Response("<html>upstream error</html>", { status: 502 });
  await assert.rejects(
    api("/api/test", z.object({ ok: z.boolean() })),
    (e) => e instanceof RequestError && !e.message.includes("upstream"),
  );
  globalThis.fetch = async () =>
    Response.json(
      { error: { message: "private database detail" } },
      { status: 404 },
    );
  await assert.rejects(
    api("/api/test", z.object({ ok: z.boolean() })),
    (e) =>
      e instanceof RequestError &&
      e.status === 404 &&
      !e.message.includes("private"),
  );
  globalThis.fetch = async () => Response.json({ unexpected: true });
  await assert.rejects(
    api("/api/test", z.object({ ok: z.boolean() })),
    (e) => e instanceof RequestError && e.status === 502,
  );
});
test("analytics rejects unknown/private metadata and failures do not reject primary actions", async (ctx) => {
  const original = globalThis.fetch;
  ctx.after(() => {
    globalThis.fetch = original;
  });
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("offline");
  };
  await track({
    eventName: "explore_clicked",
    metadata: { email: "private" },
  } as never);
  assert.equal(calls, 0);
  await track({
    eventName: "explore_clicked",
    metadata: { screen: "options", action: "explore" },
  });
  assert.equal(calls, 1);
  const attemptId = crypto.randomUUID();
  await track({ eventName: "results_viewed", attemptId });
  await track({ eventName: "results_viewed", attemptId });
  assert.equal(calls, 2);
});
