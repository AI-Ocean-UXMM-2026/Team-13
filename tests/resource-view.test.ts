import test from "node:test";
import assert from "node:assert/strict";
import { resourceView } from "../src/lib/frontend/resource-view";

test("resource presentation removes legacy labels without changing records, identifiers, URLs, or flags", () => {
  const record = {
    id: "demo-course-id",
    is_demo: true,
    title: "Demo introductory course",
    provider: "Demo learning provider",
    price_label: "Demo: cost to be confirmed",
    summary: "This demo does not enroll students. Watch a demonstration.",
    url: "https://example.com/demo-course",
  };
  const before = structuredClone(record);
  const view = resourceView(record);
  assert.equal(view.title, "Introductory course");
  assert.equal(view.provider, "Learning provider");
  assert.equal(view.price_label, "Cost to be confirmed");
  assert.equal(
    view.summary,
    "This example does not enroll students. Watch a demonstration.",
  );
  assert.equal(view.id, record.id);
  assert.equal(view.url, record.url);
  assert.equal(view.is_demo, true);
  assert.deepEqual(record, before);
});

test("resource presentation preserves real names and ordinary text", () => {
  const real = {
    is_demo: false,
    name: "Demo Academy",
    summary: "Demographic research",
  };
  assert.deepEqual(resourceView(real), real);
  assert.deepEqual(
    resourceView({ ...real, is_demo: true, name: "Democracy Institute" }),
    {
      is_demo: true,
      name: "Democracy Institute",
      summary: "Demographic research",
    },
  );
});
