import type { Advisor, PublicAdvisor, Result } from "./types";

export function publicAdvisor(a: Advisor | PublicAdvisor): PublicAdvisor {
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

// Legacy snapshots are not rewritten. Sanitize their public projection on reads/retries.
export function publicResult(result: Result): Result {
  return {
    ...result,
    advisors: (result.advisors ?? []).map(publicAdvisor),
    ...(result.areas
      ? {
          areas: result.areas.map((area) => ({
            ...area,
            advisors: (area.advisors ?? []).map(publicAdvisor),
          })),
        }
      : {}),
  };
}
