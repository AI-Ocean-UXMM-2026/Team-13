import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  mascotCatalog,
  mascotOptions,
  selectedMascot,
  mascotChoiceKey,
  mascotCard,
} from "../src/lib/frontend/result-mascots";
import { read, save } from "../src/lib/frontend/storage";

const categories = (scores: (number | undefined)[]) => ({
  rankedCategories: mascotCatalog.map((m, i) => ({
    id: m.id,
    code: m.code,
    name: m.interest,
    score: scores[i],
    maxScore: [6, 9, 6, 6, 6, 3][i],
  })),
});

test("each unique positive leading interest receives its intended character without changing career ranking", () => {
  const expected = [
    "chinthe",
    "naga",
    "karaweik",
    "hintha",
    "galon",
    "pyinsayupa",
  ];
  for (let i = 0; i < 6; i++) {
    const input = categories(
      Array.from({ length: 6 }, (_, n) =>
        n === i ? [6, 9, 6, 6, 6, 3][n] : 0,
      ),
    );
    const before = structuredClone(input);
    const result = mascotOptions(input);
    assert.equal(result.mode, "matched");
    assert.equal(selectedMascot(result.options, null)?.id, expected[i]);
    assert.deepEqual(input, before);
  }
});

test("ties offer only co-leading mascots and require an eligible choice", () => {
  const result = mascotOptions(categories([6, 9, 2, 1, 0, 0]));
  assert.equal(result.mode, "tied");
  assert.deepEqual(
    result.options.map((m) => m.id),
    ["chinthe", "naga"],
  );
  assert.equal(selectedMascot(result.options, null), undefined);
  assert.equal(selectedMascot(result.options, "naga")?.id, "naga");
  assert.equal(selectedMascot(result.options, "karaweik"), undefined);
  assert.equal(selectedMascot(result.options, "untrusted-value"), undefined);
});

test("zero, empty, missing or unusable scores allow free choice without inventing a leading theme", () => {
  for (const input of [
    categories([0, 0, 0, 0, 0, 0]),
    categories([6, undefined, 2, 1, 0, 0]),
    categories([NaN, 1, 0, 0, 0, 0]),
    categories([Infinity, 1, 0, 0, 0, 0]),
    { rankedCategories: [] },
  ]) {
    const result = mascotOptions(input);
    assert.equal(result.mode, "choice");
    assert.equal(result.options.length, 6);
    assert.equal(selectedMascot(result.options, null), undefined);
    assert.equal(selectedMascot(result.options, "galon")?.id, "galon");
  }
});

test("stored choices stay scoped to their session and attempt and survive unavailable browser storage in memory", () => {
  const session = crypto.randomUUID(),
    attempt = crypto.randomUUID();
  const key = mascotChoiceKey(session, attempt);
  save(key, "hintha"); // No window/localStorage in this test: uses the existing memory fallback.
  assert.equal(read(key), "hintha");
  assert.equal(read(mascotChoiceKey(crypto.randomUUID(), attempt)), null);
  assert.equal(read(mascotChoiceKey(session, crypto.randomUUID())), null);
  assert.equal(
    selectedMascot(
      mascotOptions(categories([0, 0, 0, 0, 0, 0])).options,
      read(key),
    )?.id,
    "hintha",
  );
  assert.equal(
    selectedMascot(
      mascotOptions(categories([6, 9, 1, 0, 0, 0])).options,
      read(key),
    ),
    undefined,
  );
  save(key, null);
});

test("equal interest across the actual unequal question counts offers all six instead of always Naga", () => {
  for (const scores of [
    [6, 9, 6, 6, 6, 3],
    [4, 6, 4, 4, 4, 2],
    [2, 3, 2, 2, 2, 1],
  ]) {
    const input = categories(scores);
    const before = structuredClone(input);
    const options = mascotOptions(input);
    assert.equal(options.mode, "tied");
    assert.equal(options.options.length, 6);
    assert.equal(selectedMascot(options.options, null), undefined);
    assert.deepEqual(input, before);
  }
});

test("a full Conventional result outranks a larger but weaker Investigative raw total", () => {
  const options = mascotOptions(categories([2, 6, 2, 2, 2, 3]));
  assert.equal(options.mode, "matched");
  assert.equal(selectedMascot(options.options, null)?.id, "pyinsayupa");
});

test("older percentage snapshots remain comparable; raw-only snapshots offer choice", () => {
  const input = {
    rankedCategories: categories([2, 6, 2, 2, 2, 3]).rankedCategories.map(
      ({ maxScore, ...c }) => ({
        ...c,
        percentage: (c.score! / maxScore) * 100,
      }),
    ),
  };
  assert.equal(
    selectedMascot(mascotOptions(input).options, null)?.id,
    "pyinsayupa",
  );
  const rawOnly = {
    rankedCategories: input.rankedCategories.map(
      ({ percentage: _percentage, ...c }) => c,
    ),
  };
  assert.equal(mascotOptions(rawOnly).mode, "choice");
  assert.equal(selectedMascot(mascotCatalog, "kinnari")?.id, "karaweik");
});

test("all six bundled exports are square PNGs with fixed non-personalized destinations", async () => {
  for (const mascot of mascotCatalog) {
    const path = mascotCard(mascot);
    assert.match(path, /^\/mascots\/results\/cards\/[a-z]+\.png$/);
    const bytes = await readFile(`public${path}`);
    assert.deepEqual(
      [...bytes.subarray(0, 8)],
      [137, 80, 78, 71, 13, 10, 26, 10],
    );
    assert.equal(bytes.readUInt32BE(16), 1080);
    assert.equal(bytes.readUInt32BE(20), 1080);
    assert.ok(mascot.burmeseName.length > 0);
  }
});
