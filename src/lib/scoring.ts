import type { Answer, Catalog, Code, Profile, Result, Ad } from "./types";
import { ApiError, validUrl } from "./validation";
import { publicAdvisor } from "./public-content";
export function canonicalAnswers(answers: Answer[]): Answer[] {
  return answers
    .map((a) => ({
      questionId: a.questionId,
      optionIds: [...a.optionIds].sort(),
    }))
    .sort((a, b) => a.questionId.localeCompare(b.questionId));
}
export function validateAnswers(
  questions: Catalog["questions"],
  answers: Answer[],
) {
  if (
    questions.length !== 20 ||
    new Set(questions.map((q) => q.position)).size !== 20
  )
    throw new ApiError(
      500,
      "QUIZ_CONFIGURATION",
      "The quiz configuration is incomplete",
    );
  if (answers.length !== questions.length)
    throw new ApiError(
      400,
      "INVALID_ANSWERS",
      "Answer every question exactly once",
    );
  const seen = new Set<string>();
  for (const a of answers) {
    const q = questions.find((q) => q.id === a.questionId);
    if (!q || seen.has(a.questionId))
      throw new ApiError(
        400,
        "INVALID_ANSWERS",
        "Unknown or duplicate question",
      );
    seen.add(a.questionId);
    if (
      a.optionIds.length < 1 ||
      a.optionIds.length > q.max_selections ||
      new Set(a.optionIds).size !== a.optionIds.length
    )
      throw new ApiError(
        400,
        "INVALID_ANSWERS",
        `Q${q.position}: invalid selection count or duplicate option`,
      );
    if (a.optionIds.some((id) => !q.options.some((o) => o.id === id)))
      throw new ApiError(
        400,
        "INVALID_ANSWERS",
        `Q${q.position}: option does not belong to question`,
      );
  }
}
export function calculate(catalog: Catalog, answers: Answer[]): Result {
  const { questions, categories, weights } = catalog;
  validateAnswers(questions, answers);
  const selected = new Set(answers.flatMap((a) => a.optionIds));
  const riasec = {} as Record<Code, number>,
    maxima = {} as Record<Code, number>,
    percentages = {} as Record<Code, number>;
  if (
    categories.length !== 6 ||
    new Set(categories.map((c) => c.code)).size !== 6
  )
    throw new ApiError(
      500,
      "SCORING_CONFIGURATION",
      "Six active interest categories are required",
    );
  // Derive maxima from configured option weights for each core question.
  for (const c of categories) {
    let score = 0,
      max = 0;
    for (const q of questions.filter((q) => q.position <= 12)) {
      const ws = weights.filter(
        (w) =>
          w.category_id === c.id && q.options.some((o) => o.id === w.option_id),
      );
      score += ws
        .filter((w) => selected.has(w.option_id))
        .reduce((s, w) => s + w.score, 0);
      max += Math.max(0, ...ws.map((w) => w.score));
    }
    if (!max)
      throw new ApiError(
        500,
        "SCORING_CONFIGURATION",
        "Missing category score mappings",
      );
    riasec[c.code] = score;
    maxima[c.code] = max;
    percentages[c.code] = Math.round((score / max) * 10000) / 100;
  }
  for (const q of questions.filter((q) => q.position <= 12))
    if (q.options.some((o) => !weights.some((w) => w.option_id === o.id)))
      throw new ApiError(
        500,
        "SCORING_CONFIGURATION",
        "Missing option score mappings",
      );
  const rankedCategories = categories
    .map((c) => ({
      ...c,
      score: riasec[c.code],
      maxScore: maxima[c.code],
      percentage: percentages[c.code],
    }))
    .sort(
      (a, b) =>
        b.score * a.maxScore - a.score * b.maxScore ||
        a.code.localeCompare(b.code),
    );
  const values = (n: number) =>
    questions
      .find((q) => q.position === n)!
      .options.filter((o) => selected.has(o.id))
      .sort((a, b) => a.position - b.position)
      .map((o) => o.value);
  const profile: Profile = {
    careerClarity: values(13)[0],
    explorationPreference: values(14)[0],
    coursePriorities: values(15),
    learningActivity: values(16)[0],
    studyOptions: values(17),
    readiness: values(18)[0],
    desiredSupport: values(19)[0],
    nextAction: values(20)[0],
  };
  const qualifying = rankedCategories.filter((c) => c.score * 2 >= c.maxScore);
  const cutoff = qualifying[2];
  const recommended = qualifying.filter(
    (c) => !cutoff || c.score * cutoff.maxScore >= cutoff.score * c.maxScore,
  );
  const topCategories = recommended.map((c) => c.code);
  // Category ranking is independent of inventory. Missing examples are an empty state.
  const priority = (id: string) =>
    rankedCategories.findIndex((c) => c.id === id);
  const courseRelevance = (c: Catalog["courses"][number]) =>
    (profile.studyOptions.includes(c.study_option) ? 4 : 0) +
    (profile.coursePriorities.includes("affordability") && c.affordable
      ? 2
      : 0) +
    (profile.coursePriorities.includes("study_length_flexibility") && c.flexible
      ? 2
      : 0) +
    (profile.explorationPreference === "online_learning" &&
    c.study_option === "online_short_courses"
      ? 1
      : 0) +
    (profile.explorationPreference === "hands_on_activity" &&
    c.study_option === "vocational_training"
      ? 1
      : 0);
  const courses = catalog.courses
    .filter((c) => categories.some((category) => category.id === c.category_id))
    .map((c) => ({ ...c, url: validUrl(c.url) }))
    .sort(
      (a, b) =>
        courseRelevance(b) - courseRelevance(a) ||
        priority(a.category_id) - priority(b.category_id) ||
        a.id.localeCompare(b.id),
    );
  const advisorRelevance = (a: Catalog["advisors"][number]) =>
    a.support_types.filter((t) =>
      [profile.explorationPreference, profile.desiredSupport].includes(t),
    ).length;
  const advisors = catalog.advisors
    .filter((a) => categories.some((category) => category.id === a.category_id))
    .sort(
      (a, b) =>
        advisorRelevance(b) - advisorRelevance(a) ||
        priority(a.category_id) - priority(b.category_id) ||
        a.id.localeCompare(b.id),
    )
    .map(publicAdvisor);
  const actionTexts: Record<string, string> = {
    try_beginner_activity:
      "Try a 30-minute beginner activity in one suggested field this week.",
    research_compare_careers:
      "Compare the daily work and entry requirements of two suggested careers this week.",
    talk_to_student_professional:
      "Prepare three questions and ask a student or professional about their experience.",
    compare_course_costs_requirements:
      "Compare the total costs and entry requirements of two relevant courses this week.",
  };
  const guidance = [
    `Your preferred learning activity is ${profile.learningActivity.replaceAll("_", " ")}.`,
    profile.readiness === "ready_for_action"
      ? "Choose one concrete step and set a date."
      : "Treat these suggestions as starting points; compare and try them before deciding.",
  ];
  if (profile.careerClarity === "unknown_interests")
    guidance.push("Start with a small activity before narrowing your options.");
  if (profile.careerClarity === "many_interests")
    guidance.push(
      "Compare two fields using the same practical activity and reflection questions.",
    );
  if (profile.careerClarity === "few_interests_uncertain")
    guidance.push(
      "Compare the everyday tasks of your existing interests with these suggestions.",
    );
  if (profile.careerClarity === "preferred_field_needs_next_step")
    guidance.push(
      "Use your preferred field to choose a beginner task or course requirement to investigate.",
    );
  if (profile.coursePriorities.includes("location_family"))
    guidance.push(
      "Check transport, location, and family commitments directly with the provider.",
    );
  if (profile.coursePriorities.includes("family_expectations"))
    guidance.push("Discuss your reasons and course options with your family.");
  if (profile.coursePriorities.includes("job_opportunities"))
    guidance.push(
      "Research current local job opportunities; demo listings do not provide employment forecasts.",
    );
  if (
    profile.desiredSupport === "advisor_conversation" ||
    profile.explorationPreference === "career_advisor"
  )
    guidance.push(
      "Review the advisor options and request contact if you consent. Demo requests do not send messages.",
    );
  if (profile.desiredSupport === "career_course_comparison")
    guidance.push(
      "Compare the suggested careers alongside course costs, requirements, and duration.",
    );
  if (profile.desiredSupport === "action_plan")
    guidance.push(
      "Pick a field today, research it tomorrow, and try one activity this week.",
    );
  if (profile.desiredSupport === "new_field_suggestions")
    guidance.push("Try one suggested field you have not considered before.");
  const areas = rankedCategories.map((c) => ({
    ...c,
    recommended: topCategories.includes(c.code),
    reason: topCategories.includes(c.code)
      ? `Your answers scored ${c.score}/${c.maxScore} (${c.percentage}%) in ${c.name}. This interest area meets the 50% exploration threshold; it is not a prediction of career success.`
      : `Browse ${c.name} out of curiosity. This area was not selected as a recommendation.`,
    careers: catalog.roles
      .filter((r) => r.category_id === c.id)
      .sort(
        (a, b) =>
          (a.display_order ?? 100) - (b.display_order ?? 100) ||
          a.title.localeCompare(b.title) ||
          a.id.localeCompare(b.id),
      )
      .slice(0, 5)
      .map((r) => ({
        ...r,
        category: c.code,
        reason: `${r.title} is an example of work involving ${c.name.toLowerCase()} interests, not an individual career match.`,
      })),
    courses: courses.filter((course) => course.category_id === c.id),
    advisors: advisors.filter((advisor) => advisor.category_id === c.id),
  }));
  const recommendations = areas
    .filter((a) => a.recommended)
    .flatMap((a) => a.careers);
  return {
    profileLabel: "RIASEC-inspired career interest profile",
    riasec,
    maxima,
    percentages,
    rankedCategories,
    topCategories,
    recommendations,
    areas,
    recommendationMode: recommended.length ? "recommended" : "browse",
    profile,
    courses,
    advisors,
    explanation: recommended.length
      ? `Your answers suggest exploring ${recommended.map((c) => c.name).join(", ")}. Areas are compared using their share of available points. Ties at the cutoff are included equally.`
      : "No interest area reached the 50% exploration threshold. Browse all six areas as neutral starting points, try an activity, and notice what interests you. These are not career matches.",
    nextAction: {
      code: profile.nextAction,
      text: actionTexts[profile.nextAction],
      guidance,
    },
    scoringVersion: "riasec-demo-v2-normalized",
  };
}
export function matchAds(ads: Ad[], ids: string[], now = new Date()) {
  return ads
    .filter(
      (a) =>
        a.category_ids.some((id) => ids.includes(id)) &&
        (!a.starts_at || new Date(a.starts_at) <= now) &&
        (!a.ends_at || new Date(a.ends_at) > now),
    )
    .map((a) => ({ ...a, url: validUrl(a.url), label: "Sponsored" as const }))
    .sort(
      (a, b) =>
        a.placement_key.localeCompare(b.placement_key) ||
        a.id.localeCompare(b.id),
    );
}
