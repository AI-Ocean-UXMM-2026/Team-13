import { z } from "zod";
import { sessionId, read, save } from "./storage";
import { eventSchema } from "../validation";
export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  options: {
    body?: unknown;
    key?: string;
    signal?: AbortSignal;
    keepalive?: boolean;
  } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  try {
    if (options.signal?.aborted) controller.abort();
    const response = await fetch(path, {
      method: options.body === undefined ? "GET" : "POST",
      cache: "no-store",
      keepalive: options.keepalive,
      signal: controller.signal,
      headers: {
        "X-Session-ID": sessionId(),
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.key ? { "Idempotency-Key": options.key } : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new RequestError(
        response.status,
        "We could not read the response. Please try again.",
      );
    }
    const errorCode = z
      .object({ error: z.object({ code: z.string() }) })
      .safeParse(data);
    const setupMessages: Record<string, string> = {
      SCHEMA_NOT_READY:
        "This database needs a setup update. Please ask the project maintainer to apply the frontend migration.",
      DATABASE_UNREACHABLE:
        "The database is temporarily unreachable. Please check the connection and retry.",
      DATABASE_ACCESS_DENIED:
        "Database access is not configured correctly. Please contact the project maintainer.",
      NOT_CONFIGURED:
        "Database settings are missing. Please contact the project maintainer.",
    };
    if (!response.ok)
      throw new RequestError(
        response.status,
        (response.status === 503 &&
          errorCode.success &&
          setupMessages[errorCode.data.error.code]) ||
          (response.status === 410
            ? "Your session has expired. Start a new session to continue."
            : response.status === 404
              ? "This item is unavailable for this session."
              : response.status === 429
                ? "Too many requests. Please wait one minute before retrying."
                : response.status === 409
                  ? "This request conflicts with an earlier action. Please reload before trying again."
                  : "We could not complete that request. Please try again."),
      );
    const parsed = schema.safeParse(data);
    if (!parsed.success)
      throw new RequestError(
        502,
        "This content is unavailable or has changed. Please retry.",
      );
    return parsed.data;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(
      0,
      "Connection interrupted. Your progress is kept here; please retry.",
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}
export async function track(input: z.input<typeof eventSchema>) {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return;
  const key = `career.view.${sessionId()}.${parsed.data.attemptId}`;
  if (parsed.data.eventName === "results_viewed") {
    if (read(key, true)) return;
    save(key, "1", true);
  }
  try {
    await api("/api/events", z.object({ recorded: z.literal(true) }), {
      body: parsed.data,
      keepalive: true,
    });
  } catch {}
}
