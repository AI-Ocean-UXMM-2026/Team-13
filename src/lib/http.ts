import { ApiError, parse, uuid } from "./validation";
import { ensureSession } from "./db";
const buckets = new Map<
  string,
  {
    count: number;
    until: number;
  }
>();
export function rateLimit(req: Request) {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.until <= now) buckets.delete(k);
  // Per-process demo limit; forwarded IP must be set by a trusted deployment proxy.
  const key =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const bucket = buckets.get(key) || { count: 0, until: now + 60000 };
  if (++bucket.count > 120 || (!buckets.has(key) && buckets.size >= 10000))
    throw new ApiError(
      429,
      "RATE_LIMITED",
      "Too many requests; retry in one minute",
    );
  buckets.set(key, bucket);
}
export async function body(req: Request): Promise<unknown> {
  if (
    !req.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new ApiError(400, "INVALID_JSON", "Send an application/json body");
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError(400, "INVALID_JSON", "JSON body required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16384) {
      await reader.cancel();
      throw new ApiError(413, "BODY_TOO_LARGE", "Body exceeds 16 KB");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Malformed JSON");
  }
}
export async function session(req: Request) {
  const id = parse(uuid, req.headers.get("x-session-id"));
  await ensureSession(id);
  return id;
}
export function wrap(action: (req: Request) => Promise<unknown>, status = 200) {
  return async (req: Request) => {
    const headers: Record<string, string> = {
      "Cache-Control": "no-store",
      Vary: "Origin",
    };
    const origin = req.headers.get("origin"),
      allowed = process.env.FRONTEND_ORIGIN;
    if (origin && allowed && origin === allowed) {
      headers["Access-Control-Allow-Origin"] = allowed;
      headers["Access-Control-Allow-Headers"] =
        "Content-Type, X-Session-ID, Idempotency-Key";
      headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    }
    try {
      // Next may normalize req.url to localhost while the browser uses 127.0.0.1.
      const target = new URL(req.url);
      const ownOrigin = `${target.protocol}//${req.headers.get("host") || target.host}`;
      if (origin && origin !== ownOrigin && origin !== allowed)
        throw new ApiError(403, "ORIGIN_DENIED", "Origin is not allowed");
      if (req.method === "OPTIONS")
        return new Response(null, { status: 204, headers });
      rateLimit(req);
      return Response.json(await action(req), { status, headers });
    } catch (e) {
      const err =
        e instanceof ApiError
          ? e
          : new ApiError(
              500,
              "INTERNAL_ERROR",
              "The operation could not be completed",
            );
      if (err.status === 429) headers["Retry-After"] = "60";
      return Response.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status, headers },
      );
    }
  };
}
