import test from "node:test";
import assert from "node:assert/strict";
import { courseSchema, type CourseView } from "../src/lib/frontend/contracts";
import { learningRoadmap } from "../src/lib/frontend/learning-roadmap";

const role = "8a44d176-5457-5aaa-b350-86422de76d06";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function course(n: number, changes: Partial<CourseView> = {}): CourseView {
  return {
    id: id(n),
    category_id: id(1),
    title: "Course",
    summary: "Summary",
    provider: "Provider",
    price_label: "Free",
    url: null,
    is_demo: false,
    ...changes,
  };
}

test("a career path includes its own courses in exploration order without mutating the catalog", () => {
  const catalog = [
    course(7, { study_option: "vocational_training" }),
    course(8, { category_id: id(2), study_option: "online_short_courses" }),
    course(5, { title: "Zebra", study_option: "online_short_courses" }),
    course(4, { title: "Alpha", study_option: "online_short_courses" }),
    course(9),
  ];
  const before = structuredClone(catalog);
  const path = learningRoadmap(role, id(1), catalog);
  assert.deepEqual(
    path.courses.map((c) => c.id),
    [id(4), id(5), id(7)],
  );
  assert.equal(path.activity?.title, "Make an idea visible");
  assert.equal(path.activity?.minutes, 25);
  assert.deepEqual(catalog, before);
});

test("older or unknown course formats remain readable and ties resolve consistently", () => {
  const legacy = courseSchema.parse(course(4));
  const unknown = courseSchema.parse(
    course(3, { study_option: "future_format" }),
  );
  const malformed = courseSchema.parse({ ...course(2), study_option: 42 });
  const path = learningRoadmap(role, id(1), [legacy, unknown, malformed]);
  assert.deepEqual(
    path.courses.map((c) => c.id),
    [id(2), id(3), id(4)],
  );
  assert.equal(malformed.study_option, undefined);
});

test("unconfigured careers and empty categories never borrow another career's activity or courses", () => {
  const path = learningRoadmap(id(99), id(2), [course(3)]);
  assert.equal(path.activity, undefined);
  assert.deepEqual(path.courses, []);
});

test("demo presentation preserves course identifiers, destinations and fictional status", () => {
  const original = course(3, {
    title: "Demo online course",
    provider: "Demo provider",
    is_demo: true,
  });
  const displayed = learningRoadmap(role, id(1), [original]).courses[0];
  assert.equal(displayed.title, "Online course");
  assert.equal(displayed.id, original.id);
  assert.equal(displayed.is_demo, true);
  assert.equal(original.title, "Demo online course");
});
