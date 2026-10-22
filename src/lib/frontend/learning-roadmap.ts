import { activities } from "./activities";
import type { CourseView } from "./contracts";
import { resourceView } from "./resource-view";

const formatOrder = (format?: string) =>
  format === "online_short_courses"
    ? 0
    : format === "vocational_training"
      ? 1
      : 2;

export function learningRoadmap(
  roleId: string,
  categoryId: string,
  courses: CourseView[],
) {
  return {
    activity: Object.hasOwn(activities, roleId)
      ? activities[roleId]
      : undefined,
    courses: courses
      .filter((course) => course.category_id === categoryId)
      .sort(
        (a, b) =>
          formatOrder(a.study_option) - formatOrder(b.study_option) ||
          a.title.localeCompare(b.title, "en") ||
          a.id.localeCompare(b.id, "en"),
      )
      .slice(0, 3)
      .map(resourceView),
  };
}
