import { z } from "zod";
import { resourceView } from "./resource-view";
const id = z.uuid();
export const questionSchema = z.object({
  id,
  position: z.number().int(),
  text: z.string(),
  maxSelections: z.union([z.literal(1), z.literal(2)]),
  options: z
    .array(
      z.object({
        id,
        text: z.string(),
        value: z.string(),
        position: z.number(),
      }),
    )
    .min(2),
});
export const quizSchema = z.object({
  questions: z.array(questionSchema).length(20),
});
export type PublicQuestion = z.infer<typeof questionSchema>;
export const courseSchema = z.object({
  id,
  category_id: id,
  title: z.string(),
  summary: z.string(),
  provider: z.string(),
  price_label: z.string(),
  url: z.string().nullable(),
  is_demo: z.boolean(),
});
export const advisorSchema = z.object({
  id,
  category_id: id,
  name: z.string(),
  specialty: z.string(),
  summary: z.string().optional(),
  is_demo: z.boolean(),
});
export const adSchema = z.object({
  id,
  title: z.string(),
  summary: z.string().optional(),
  provider_name: z.string().optional(),
  url: z.string().nullable(),
  label: z.literal("Sponsored"),
  is_demo: z.boolean(),
});
export const coursesSchema = z.object({ courses: z.array(courseSchema) });
export const advisorsSchema = z.object({ advisors: z.array(advisorSchema) });
export const adsSchema = z.object({
  placements: z.record(z.string(), z.array(adSchema)),
});
export const resultSchema = z.object({
  attemptId: id,
  result: z.object({
    recommendations: z
      .array(
        z.object({
          id,
          category_id: id,
          title: z.string(),
          description: z.string(),
          is_demo: z.boolean(),
          category: z.enum(["R", "I", "A", "S", "E", "C"]),
          reason: z.string(),
          suggested_next_step: z.string().nullable().optional(),
        }),
      )
      .max(3),
    rankedCategories: z.array(
      z.object({
        id,
        code: z.enum(["R", "I", "A", "S", "E", "C"]),
        name: z.string(),
        score: z.number().nonnegative().optional().catch(undefined),
      }),
    ),
    profile: z
      .object({
        explorationPreference: z.string().optional().catch(undefined),
        coursePriorities: z.array(z.string()).optional().catch(undefined),
      })
      .optional()
      .catch(undefined),
    explanation: z.string(),
    nextAction: z.object({ text: z.string(), guidance: z.array(z.string()) }),
  }),
});
export type ResultView = z.infer<typeof resultSchema>["result"];
export function recommendationViews(result: ResultView) {
  return result.recommendations.map((r) => ({
    ...resourceView(r),
    categoryName:
      result.rankedCategories.find((c) => c.id === r.category_id)?.name ??
      r.category,
  }));
}
export const startResponse = z.object({ attemptId: id });
export const interestResponse = z.object({
  recorded: z.literal(true),
  url: z.string().refine((value) => safeExternalUrl(value) !== null),
  isDemo: z.boolean(),
});
export const leadResponse = z.object({
  leadId: id,
  recorded: z.literal(true),
  message: z.string(),
});
export function safeExternalUrl(value: string | null): string | null {
  try {
    const url = new URL(value ?? "");
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
