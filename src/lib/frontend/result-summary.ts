import type { ResultView } from "./contracts";

export const NOT_RECORDED = "Not recorded in this result.";

const explorationLabels: Readonly<Record<string, string>> = {
  hands_on_activity: "Trying a small real-world activity",
  online_learning: "Watching demonstrations or learning online",
  professional_conversation: "Talking with a student or working professional",
  career_advisor: "Speaking with a career advisor",
};

const priorityLabels: Readonly<Record<string, string>> = {
  interests_and_strengths: "My interests and strengths",
  job_opportunities: "Job opportunities after graduation",
  affordability: "Tuition fees and affordability",
  location_family: "Location, transport, and family circumstances",
  family_expectations: "Family expectations",
  study_length_flexibility: "Length and flexibility of study",
};

export function resultSummary(result: ResultView) {
  const neutralInterests =
    result.rankedCategories.length > 0 &&
    result.rankedCategories.every((category) => category.score === 0);
  // Categories arrive in backend order, including its tie-breaker. Never rank here.
  const interests = neutralInterests
    ? []
    : result.rankedCategories.slice(0, 3).map((category) => category.name);
  const preference = result.profile?.explorationPreference;
  const exploration =
    preference && Object.hasOwn(explorationLabels, preference)
      ? explorationLabels[preference]
      : NOT_RECORDED;
  const priorities = [...new Set(result.profile?.coursePriorities ?? [])]
    .filter((priority) => Object.hasOwn(priorityLabels, priority))
    .map((priority) => priorityLabels[priority]);
  return { neutralInterests, interests, exploration, priorities };
}
