"use client";
import Link from "next/link";
import { useState } from "react";
import type { AreaView } from "@/lib/frontend/contracts";
import { activities } from "@/lib/frontend/activities";
import { track } from "@/lib/frontend/api";
import { resourceView } from "@/lib/frontend/resource-view";

export default function InterestAreas({
  areas,
  attemptId,
}: {
  areas: AreaView[];
  attemptId: string;
}) {
  const recommended = areas.filter((a) => a.recommended);
  const [browse, setBrowse] = useState(false);
  const neutral = recommended.length === 0;
  const shown =
    neutral || browse
      ? [...recommended, ...areas.filter((a) => !a.recommended)]
      : recommended;
  return (
    <section aria-labelledby="areas-title" className="interest-area-results">
      <h2 id="areas-title">
        {neutral
          ? "Explore all six interest areas"
          : "Your interest areas to explore"}
      </h2>
      <p>
        Example careers illustrate each area. They are not individual career
        matches, admission advice, or promises of employment.
      </p>
      <p className="fine-print">
        Interest scores compare points earned with points available. The 50%
        threshold is an exploration rule, not a validated assessment cutoff.
        Areas tied at the third-place cutoff are included equally.
      </p>
      {shown.map((area) => (
        <section
          className="interest-area"
          key={area.id}
          aria-labelledby={`area-${area.code}`}
        >
          <div className="section-heading">
            <h3 id={`area-${area.code}`}>{area.name}</h3>
            <span className="eyebrow">
              {area.recommended ? "Suggested area" : "Browse for curiosity"}
            </span>
          </div>
          <p>{area.description}</p>
          <p className="area-score">
            {area.percentage}% interest score · {area.score}/{area.maxScore}{" "}
            available points
          </p>
          <p>{area.reason}</p>
          <div className="career-example-grid">
            {area.careers.map(resourceView).map((role) => (
              <article className="career-example" key={role.id}>
                <p className="eyebrow">Example career</p>
                <h4>{role.title}</h4>
                <p>{role.description}</p>
                <p>{role.reason}</p>
                {role.suggested_next_step && (
                  <p>
                    <strong>Try first: </strong>
                    {role.suggested_next_step}
                  </p>
                )}
                {(role.activity || activities[role.id]) && (
                  <Link
                    className="button secondary"
                    href={`/explore/${role.id}?attemptId=${attemptId}`}
                    onClick={() =>
                      void track({
                        eventName: "explore_clicked",
                        attemptId,
                        metadata: { screen: "results", action: "explore" },
                      })
                    }
                  >
                    Try an activity
                  </Link>
                )}
              </article>
            ))}
          </div>
          {!area.careers.length && (
            <p className="empty">
              Career examples are being prepared for this area. You can still
              explore its resources.
            </p>
          )}
          <Link
            className="button primary"
            href={`/options/${attemptId}?category=${area.code}`}
          >
            Explore {area.name.toLowerCase()} courses and advisors
          </Link>
        </section>
      ))}
      {!neutral && recommended.length < areas.length && (
        <button
          className="button secondary"
          onClick={() => setBrowse((v) => !v)}
          aria-expanded={browse}
        >
          {browse ? "Show suggested areas only" : "Browse all interest areas"}
        </button>
      )}
    </section>
  );
}
