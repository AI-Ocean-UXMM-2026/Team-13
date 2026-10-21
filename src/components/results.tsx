"use client";
import Link from "next/link";
import { useEffect } from "react";
import { track } from "@/lib/frontend/api";
import { recommendationViews, resultSchema } from "@/lib/frontend/contracts";
import {
  DemoBadge,
  Empty,
  ErrorState,
  Loading,
  PageIntro,
  useResource,
} from "./shared";
export default function Results({ attemptId }: { attemptId: string }) {
  const { data, error, retry } = useResource(
    `/api/results/${attemptId}`,
    resultSchema,
  );
  useEffect(() => {
    if (data)
      void track({
        eventName: "results_viewed",
        attemptId: data.attemptId,
        metadata: { screen: "results" },
      });
  }, [data]);
  if (error) return <ErrorState error={error} retry={retry} />;
  if (!data) return <Loading label="Opening your directions…" />;
  const cards = recommendationViews(data.result);
  return (
    <>
      <PageIntro eyebrow="02 / REFLECT" title="A few directions to explore.">
        <p>
          Your interests can open more than one door. Here are some starting
          points, with a small step you can try for each.
        </p>
      </PageIntro>
      <p className="result-explanation">{data.result.explanation}</p>
      {!cards.length ? (
        <Empty>
          No directions are available for this attempt.{" "}
          <Link href="/">Start a new quiz</Link> or{" "}
          <button onClick={retry} className="text-link">
            retry loading
          </button>
          .
        </Empty>
      ) : (
        <div className="recommendation-grid">
          {cards.map((r, i) => (
            <article className={`recommendation-card tone-${i}`} key={r.id}>
              <div className="card-top">
                <span className="eyebrow">
                  DIRECTION {String(i + 1).padStart(2, "0")}
                </span>
                <span className="direction-symbol" aria-hidden>
                  {["✳", "↗", "◈"][i]}
                </span>
              </div>
              <p className="category-label">{r.categoryName}</p>
              <h2>{r.title}</h2>
              <p>{r.description}</p>
              <div className="why-block">
                <h3>Why explore this?</h3>
                <p>{r.reason}</p>
              </div>
              {r.suggested_next_step && (
                <div className="next-step">
                  <h3>A small first step</h3>
                  <p>{r.suggested_next_step}</p>
                </div>
              )}
              <Link
                className="button secondary full"
                href={`/options/${attemptId}?category=${r.category}`}
              >
                Explore this direction <span aria-hidden>↗</span>
              </Link>
              {r.is_demo && <DemoBadge />}
            </article>
          ))}
        </div>
      )}
      <div className="reassurance">
        <span aria-hidden>✧</span>
        <p>
          These are starting points for exploration, not a final career
          judgment. Your interests can change as you try new things.
        </p>
      </div>
      <div className="result-actions">
        {cards.length > 0 && (
          <Link className="button primary" href={`/options/${attemptId}`}>
            Choose a next step <span aria-hidden>→</span>
          </Link>
        )}
        <Link
          href="/"
          className="text-link"
          onClick={(e) => {
            if (
              !window.confirm(
                "Start again? Your existing results remain available at this link.",
              )
            )
              e.preventDefault();
          }}
        >
          Take the quiz again
        </Link>
      </div>
    </>
  );
}
