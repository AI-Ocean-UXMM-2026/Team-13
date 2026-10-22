import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Catalog, Question, Option } from "./types";
import { ApiError, databaseFailure } from "./validation";
let client: SupabaseClient | undefined;
export function db() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new ApiError(
      503,
      "NOT_CONFIGURED",
      "Database configuration is missing",
    );
  if (!client)
    client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  return client;
}
export function check<T>(response: {
  data: T;
  status?: number;
  error: {
    code?: string;
  } | null;
}): NonNullable<T> {
  if (response.error)
    throw databaseFailure(response.error.code, response.status);
  return response.data as NonNullable<T>;
}
export async function requireFrontendSchema() {
  const result = await db()
    .from("app_migrations")
    .select("version", { head: true, count: "exact" })
    .in("version", ["202610210002", "202610230001"]);
  if (result.error) throw databaseFailure(result.error.code, result.status);
  if (result.count !== 2)
    throw new ApiError(
      503,
      "SCHEMA_NOT_READY",
      "The database needs the frontend setup migration",
    );
}
export async function active<T>(table: string): Promise<T[]> {
  return check(
    await db().from(table).select("*").eq("is_active", true).order("id"),
  ) as T[];
}
export async function quiz(): Promise<Question[]> {
  const [qs, options] = await Promise.all([
    active<Omit<Question, "options">>("quiz_questions"),
    active<Option>("quiz_options"),
  ]);
  const questions = qs
    .map((q) => ({
      ...q,
      options: options
        .filter((o) => o.question_id === q.id)
        .sort((a, b) => a.position - b.position),
    }))
    .sort((a, b) => a.position - b.position);
  if (questions.length !== 20 || questions.some((q) => q.options.length < 2))
    throw new ApiError(
      500,
      "QUIZ_CONFIGURATION",
      "The quiz configuration is incomplete",
    );
  return questions;
}
export async function catalog(): Promise<Catalog> {
  const [questions, categories, weights, roles, courses, advisors] =
    await Promise.all([
      quiz(),
      active<Catalog["categories"][number]>("career_categories"),
      db().from("option_category_scores").select("*").then(check),
      active<Catalog["roles"][number]>("career_roles"),
      active<Catalog["courses"][number]>("courses"),
      active<Catalog["advisors"][number]>("advisors"),
    ]);
  return { questions, categories, weights, roles, courses, advisors };
}
export async function ensureSession(id: string) {
  check(
    await db()
      .from("anonymous_sessions")
      .upsert({ id }, { onConflict: "id", ignoreDuplicates: true }),
  );
  const session = check(
    await db()
      .from("anonymous_sessions")
      .select("expires_at")
      .eq("id", id)
      .single(),
  );
  if (new Date(session.expires_at) <= new Date())
    throw new ApiError(
      410,
      "SESSION_EXPIRED",
      "Create a new anonymous session ID",
    );
}
export async function attempt(id: string, session: string) {
  const data = check(
    await db()
      .from("quiz_attempts")
      .select("*")
      .eq("id", id)
      .eq("session_id", session)
      .maybeSingle(),
  );
  if (!data) throw new ApiError(404, "NOT_FOUND", "Quiz attempt not found");
  return data;
}
