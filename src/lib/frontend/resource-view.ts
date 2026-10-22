const displayFields = [
  "title",
  "name",
  "description",
  "summary",
  "specialty",
  "provider",
  "provider_name",
  "price_label",
  "reason",
  "suggested_next_step",
] as const;

// Remove legacy sample labels from presentation only; identifiers, URLs, and
// stored/API records keep their original values.
export function resourceView<T extends { is_demo: boolean }>(resource: T): T {
  if (!resource.is_demo) return resource;
  const view: Record<string, unknown> = { ...resource };
  for (const field of displayFields) {
    const value = view[field];
    if (typeof value !== "string") continue;
    const withoutPrefix = value.replace(/^\s*demo(?:\s*[:–—-]\s*|\s+|$)/i, "");
    const text = withoutPrefix.replace(/\bdemo\b/gi, (word) =>
      word[0] === "D" ? "Example" : "example",
    );
    view[field] =
      withoutPrefix !== value
        ? text.charAt(0).toUpperCase() + text.slice(1) || "Example"
        : text;
  }
  return view as T;
}
