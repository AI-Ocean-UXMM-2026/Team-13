import { z } from "zod";
import type { PublicQuestion } from "./contracts";
const memory = new Map<string, string>();
let unavailable = false;
export function storageUnavailable() {
  return unavailable;
}
export function read(key: string, tab = false): string | null {
  try {
    const value = (tab ? window.sessionStorage : window.localStorage).getItem(
      key,
    );
    return value ?? memory.get(key) ?? null;
  } catch {
    unavailable = true;
    return memory.get(key) ?? null;
  }
}
export function save(key: string, value: string | null, tab = false) {
  if (value === null) memory.delete(key);
  else memory.set(key, value);
  try {
    const storage = tab ? window.sessionStorage : window.localStorage;
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    unavailable = true;
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event("career-storage-warning"));
  }
}
export function sessionId() {
  const current = read("career.session");
  if (z.uuid().safeParse(current).success) return current!;
  const id = crypto.randomUUID();
  save("career.session", id);
  return id;
}
export function resetSession() {
  save(`career.draft.${sessionId()}`, null);
  save("career.session", null);
  save("career.pendingStart", null);
  save("career.completed", null);
}
export const entryReason = z.enum(["too_many_interests", "not_sure_yet"]);
export type EntryReason = z.infer<typeof entryReason>;
export const draftSchema = z.object({
  schemaVersion: z.literal(1),
  sessionId: z.uuid(),
  attemptId: z.uuid(),
  entryReason,
  questionIds: z.array(z.uuid()),
  answers: z.record(z.string(), z.array(z.uuid())),
  currentQuestionIndex: z.number().int().min(0),
  updatedAt: z.number(),
});
export type Draft = z.infer<typeof draftSchema>;
export const DRAFT_LIFETIME = 7 * 24 * 60 * 60 * 1000;
export function parseDraft(
  raw: string | null,
  sid: string,
  now = Date.now(),
): Draft | null {
  try {
    const draft = draftSchema.parse(JSON.parse(raw ?? ""));
    return draft.sessionId === sid &&
      now - draft.updatedAt < DRAFT_LIFETIME &&
      draft.updatedAt <= now
      ? draft
      : null;
  } catch {
    return null;
  }
}
export function loadDraft() {
  const key = `career.draft.${sessionId()}`;
  const raw = read(key);
  const draft = parseDraft(raw, sessionId());
  if (raw && !draft) save(key, null);
  return draft;
}
export function storeDraft(draft: Draft) {
  save(`career.draft.${draft.sessionId}`, JSON.stringify(draft));
}
export function compatibleDraft(draft: Draft, questions: PublicQuestion[]) {
  return (
    draft.questionIds.length === questions.length &&
    draft.questionIds.every((id, i) => id === questions[i]?.id) &&
    draft.currentQuestionIndex < questions.length &&
    Object.entries(draft.answers).every(([qid, ids]) => {
      const q = questions.find((q) => q.id === qid);
      return (
        q &&
        new Set(ids).size === ids.length &&
        ids.length <= q.maxSelections &&
        ids.every((id) => q.options.some((o) => o.id === id))
      );
    })
  );
}
export function validSelection(q: PublicQuestion, selected: string[]) {
  return (
    selected.length >= 1 &&
    selected.length <= q.maxSelections &&
    new Set(selected).size === selected.length &&
    selected.every((id) => q.options.some((o) => o.id === id))
  );
}
export function toggleSelection(
  q: PublicQuestion,
  selected: string[],
  id: string,
) {
  if (q.maxSelections === 1) return [id];
  return selected.includes(id)
    ? selected.filter((v) => v !== id)
    : selected.length < q.maxSelections
      ? [...selected, id]
      : selected;
}
export function startKey(reason: EntryReason) {
  try {
    const pending = JSON.parse(read("career.pendingStart") ?? "null");
    if (
      pending?.reason === reason &&
      pending?.sessionId === sessionId() &&
      z.uuid().safeParse(pending?.key).success
    )
      return pending.key as string;
  } catch {}
  const key = crypto.randomUUID();
  save(
    "career.pendingStart",
    JSON.stringify({ reason, sessionId: sessionId(), key }),
  );
  return key;
}
