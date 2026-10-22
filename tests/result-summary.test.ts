import test from "node:test";
import assert from "node:assert/strict";
import {
  recommendationViews,
  resultSchema,
} from "../src/lib/frontend/contracts";
import {
  NOT_RECORDED,
  resultSummary,
} from "../src/lib/frontend/result-summary";

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const categories = [
  { id: uuid(10), code: "S", name: "Social", score: 6 },
  { id: uuid(11), code: "A", name: "Artistic", score: 6 },
  { id: uuid(12), code: "I", name: "Investigative", score: 4 },
  { id: uuid(13), code: "R", name: "Realistic", score: 3 },
];
const base = {
  rankedCategories: categories,
  recommendations: categories.slice(0, 3).map((category, i) => ({
    id: uuid(20 + i),
    category_id: category.id,
    category: category.code,
    title: `Direction ${i + 1}`,
    description: "A possible direction.",
    reason: "Backend-provided reason.",
    is_demo: true,
  })),
  profile: {
    explorationPreference: "hands_on_activity",
    coursePriorities: ["affordability", "study_length_flexibility"],
  },
  explanation: "A backend-provided explanation.",
  nextAction: { text: "Choose a next step.", guidance: [] },
};
const parse = (overrides: Record<string, unknown> = {}) =>
  resultSchema.parse({ attemptId: uuid(1), result: { ...base, ...overrides } })
    .result;

test("Reflect preserves backend interest and career order, including ties, and translates selected preferences", () => {
  const result = parse();
  const before = structuredClone(result);
  const summary = resultSummary(result);
  assert.deepEqual(summary.interests, ["Social", "Artistic", "Investigative"]);
  assert.equal(summary.exploration, "Trying a small real-world activity");
  assert.deepEqual(summary.priorities, [
    "Tuition fees and affordability",
    "Length and flexibility of study",
  ]);
  assert.deepEqual(
    recommendationViews(result).map((r) => r.title),
    ["Direction 1", "Direction 2", "Direction 3"],
  );
  assert.deepEqual(result, before);
});

test("all-zero results keep the server's neutral explanation without presenting tie-breakers as interests", () => {
  const explanation =
    "You reported no interest in the core activities. These are neutral exploration examples.";
  const result = parse({
    rankedCategories: categories.map((category) => ({ ...category, score: 0 })),
    explanation,
  });
  const summary = resultSummary(result);
  assert.equal(summary.neutralInterests, true);
  assert.deepEqual(summary.interests, []);
  assert.equal(result.explanation, explanation);
  assert.equal(recommendationViews(result).length, 3);
  assert.equal(
    resultSummary(parse({ rankedCategories: [] })).neutralInterests,
    false,
  );
});

test("older and malformed optional metadata do not prevent results from loading", () => {
  const rankedCategories = categories.map(
    ({ score: _score, ...category }) => category,
  );
  for (const profile of [
    undefined,
    null,
    "invalid",
    [],
    { explorationPreference: 3, coursePriorities: "invalid" },
  ]) {
    const result = parse({ profile, rankedCategories });
    assert.equal(resultSummary(result).exploration, NOT_RECORDED);
    assert.deepEqual(resultSummary(result).priorities, []);
    assert.deepEqual(resultSummary(result).interests, [
      "Social",
      "Artistic",
      "Investigative",
    ]);
    assert.equal(recommendationViews(result).length, 3);
  }
  const result = parse({
    rankedCategories: categories.map((category) => ({
      ...category,
      score: "invalid",
    })),
    profile: {
      explorationPreference: "career_advisor",
      coursePriorities: [null],
    },
  });
  assert.equal(result.rankedCategories[0].score, undefined);
  assert.equal(
    resultSummary(result).exploration,
    "Speaking with a career advisor",
  );
  assert.deepEqual(resultSummary(result).priorities, []);
  assert.equal(
    resultSchema.safeParse({
      attemptId: uuid(1),
      result: { ...base, recommendations: "invalid" },
    }).success,
    false,
  );
});

test("unknown preference codes are never displayed and do not hide recognized selections", () => {
  const result = parse({
    profile: {
      explorationPreference: "__proto__",
      coursePriorities: [
        "new_private_code",
        "job_opportunities",
        "affordability",
        "job_opportunities",
        "constructor",
      ],
    },
  });
  assert.equal(resultSummary(result).exploration, NOT_RECORDED);
  assert.deepEqual(resultSummary(result).priorities, [
    "Job opportunities after graduation",
    "Tuition fees and affordability",
  ]);
  assert.equal(
    resultSummary(
      parse({ profile: { explorationPreference: "online_learning" } }),
    ).exploration,
    "Watching demonstrations or learning online",
  );
  assert.equal(
    resultSummary(
      parse({
        profile: { explorationPreference: "professional_conversation" },
      }),
    ).exploration,
    "Talking with a student or working professional",
  );
});
