import { z } from "zod";
import { active, attempt, catalog, check, db, quiz } from "./db";
import { body, session } from "./http";
import {
  ApiError,
  completeSchema,
  eventSchema,
  leadSchema,
  parse,
  uuid,
  validUrl,
} from "./validation";
import { calculate, matchAds, canonicalAnswers } from "./scoring";
import type { Ad, Advisor, Category, Course } from "./types";
export async function getQuiz() {
  const questions = await quiz();
  return {
    questions: questions.map((q) => ({
      id: q.id,
      position: q.position,
      text: q.text,
      maxSelections: q.max_selections,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text,
        value: o.value,
        position: o.position,
      })),
    })),
  };
}
async function write(
  req: Request,
  sid: string,
  operation: string,
  payload: unknown,
) {
  const rawKey = req.headers.get("Idempotency-Key");
  const key = rawKey ? parse(uuid, rawKey) : crypto.randomUUID();
  return check(
    await db().rpc("frontend_write", {
      p_session: sid,
      p_key: key,
      p_operation: operation,
      p_payload: payload,
    }),
  );
}
export async function start(req: Request) {
  const sid = await session(req);
  const input = parse(
    z.strictObject({
      entryReason: z.enum(["too_many_interests", "not_sure_yet"]).optional(),
    }),
    await body(req),
  );
  return write(req, sid, "start", input);
}
export async function complete(req: Request) {
  const sid = await session(req),
    input = parse(completeSchema, await body(req));
  const current = await attempt(input.attemptId, sid);
  const answers = canonicalAnswers(input.answers);
  if (current.status === "completed") {
    if (
      JSON.stringify(canonicalAnswers(current.answers_json)) !==
      JSON.stringify(answers)
    )
      throw new ApiError(
        409,
        "CONFLICT",
        "This attempt has already been completed with different answers",
      );
    return { attemptId: input.attemptId, result: current.result_json };
  }
  const result = calculate(await catalog(), input.answers);
  const saved = check(
    await db().rpc("complete_quiz", {
      p_session: sid,
      p_attempt: input.attemptId,
      p_answers: answers,
      p_result: result,
    }),
  );
  if (!saved) throw new ApiError(404, "NOT_FOUND", "Quiz attempt not found");
  return { attemptId: input.attemptId, result: saved };
}
export async function results(req: Request, id: string) {
  const sid = await session(req),
    a = await attempt(parse(uuid, id), sid);
  if (a.status !== "completed")
    throw new ApiError(404, "NOT_FOUND", "Completed result not found");
  return { attemptId: a.id, result: a.result_json };
}
async function categoryIds(req: Request) {
  const params = new URL(req.url).searchParams;
  const raw = params.get("category");
  if (!raw) return undefined;
  const codes = parse(
    z
      .array(z.enum(["R", "I", "A", "S", "E", "C"]))
      .min(1)
      .max(6),
    raw.split(","),
  );
  const categories = await active<Category>("career_categories");
  return categories.filter((c) => codes.includes(c.code)).map((c) => c.id);
}
export async function courses(req: Request) {
  const ids = await categoryIds(req);
  return {
    courses: (await active<Course>("courses"))
      .filter((c) => !ids || ids.includes(c.category_id))
      .map((c) => ({ ...c, url: validUrl(c.url) })),
  };
}
export async function advisors(req: Request) {
  const ids = await categoryIds(req);
  return {
    advisors: (await active<Advisor>("advisors"))
      .filter((a) => !ids || ids.includes(a.category_id))
      .map(publicAdvisor),
  };
}
export async function courseDetail(_req: Request, id: string) {
  parse(uuid, id);
  const c = (await active<Course>("courses")).find((c) => c.id === id);
  if (!c) throw new ApiError(404, "NOT_FOUND", "Course not found");
  return { course: { ...c, url: validUrl(c.url) } };
}
export async function advisorDetail(_req: Request, id: string) {
  parse(uuid, id);
  const a = (await active<Advisor>("advisors")).find((a) => a.id === id);
  if (!a) throw new ApiError(404, "NOT_FOUND", "Advisor not found");
  return { advisor: publicAdvisor(a) };
}
function publicAdvisor(a: Advisor) {
  return {
    id: a.id,
    category_id: a.category_id,
    name: a.name,
    specialty: a.specialty,
    summary: a.summary,
    support_types: a.support_types,
    is_demo: a.is_demo,
  };
}
export async function interest(req: Request, id: string) {
  const sid = await session(req);
  const input = parse(
    z.strictObject({ attemptId: uuid.optional() }),
    await body(req),
  );
  const { course: c } = await courseDetail(req, id);
  if (!c.url)
    throw new ApiError(409, "NO_PROVIDER_URL", "No provider URL is configured");
  return write(req, sid, `interest:${id}`, { ...input, courseId: id });
}
export async function lead(req: Request, id: string) {
  const sid = await session(req),
    input = parse(leadSchema, await body(req));
  await advisorDetail(req, id);
  return write(req, sid, `lead:${id}`, { ...input, advisorId: id });
}
export async function ads(req: Request) {
  const ids = await categoryIds(req);
  if (!ids)
    throw new ApiError(
      400,
      "INVALID_INPUT",
      "category is required for sponsored placements",
    );
  const matches = matchAds(await active<Ad>("ads"), ids);
  const placements: Record<string, typeof matches> = {};
  for (const ad of matches) (placements[ad.placement_key] ??= []).push(ad);
  return { placements };
}
export async function event(req: Request) {
  const sid = await session(req),
    input = parse(eventSchema, await body(req));
  if (input.attemptId) {
    const a = await attempt(input.attemptId, sid);
    if (input.eventName === "results_viewed" && a.status !== "completed")
      throw new ApiError(
        400,
        "INVALID_INPUT",
        "A completed attempt is required",
      );
  }
  if (input.entityId) {
    const table =
      input.eventName === "course_clicked"
        ? "courses"
        : input.eventName === "advisor_clicked"
          ? "advisors"
          : undefined;
    if (!table)
      throw new ApiError(
        400,
        "INVALID_INPUT",
        "entityId is not valid for this event",
      );
    const entity = check(
      await db()
        .from(table)
        .select("id")
        .eq("id", input.entityId)
        .eq("is_active", true)
        .maybeSingle(),
    );
    if (!entity) throw new ApiError(400, "INVALID_INPUT", "Unknown entity");
  }
  check(
    await db()
      .from("analytics_events")
      .insert({
        session_id: sid,
        attempt_id: input.attemptId,
        event_name: input.eventName,
        entity_id: input.entityId,
        metadata: input.metadata,
      }),
  );
  return { recorded: true };
}
export async function health() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new ApiError(
      503,
      "NOT_CONFIGURED",
      "Database configuration is missing",
    );
  const res = await db()
    .from("career_categories")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  if (res.error || res.count !== 6)
    throw new ApiError(
      503,
      "DATABASE_UNAVAILABLE",
      "Database is unavailable or not seeded",
    );
  return { status: "ok", database: "reachable" };
}
