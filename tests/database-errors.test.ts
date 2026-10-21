import test from "node:test";
import assert from "node:assert/strict";
import { databaseFailure } from "../src/lib/validation";
test("missing hosted schema reports setup readiness instead of a generic server error", () => {
  for (const code of [
    "PGRST202",
    "PGRST204",
    "PGRST205",
    "42703",
    "42P01",
    "42883",
  ]) {
    const error = databaseFailure(code, 404);
    assert.equal(error.status, 503);
    assert.equal(error.code, "SCHEMA_NOT_READY");
  }
});
test("network and credential failures are distinct, safe setup errors", () => {
  assert.equal(databaseFailure("", 0).code, "DATABASE_UNREACHABLE");
  assert.equal(databaseFailure("", 401).code, "DATABASE_ACCESS_DENIED");
  assert.equal(databaseFailure("", 403).code, "DATABASE_ACCESS_DENIED");
  assert.equal(databaseFailure("unknown", 500).code, "DATABASE_ERROR");
});
test("ownership, expiry, and idempotency conflicts retain their status codes", () => {
  for (const [code, status] of [
    ["P0404", 404],
    ["P0409", 409],
    ["P0410", 410],
    ["23505", 409],
  ] as const)
    assert.equal(databaseFailure(code).status, status);
});
