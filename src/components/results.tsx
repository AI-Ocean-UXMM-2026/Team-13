"use client";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect } from "react";
import { track } from "@/lib/frontend/api";
import { recommendationViews, resultSchema } from "@/lib/frontend/contracts";
import { NOT_RECORDED, resultSummary } from "@/lib/frontend/result-summary";
import { Empty, ErrorState, Loading, useResource } from "./shared";
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
  const summary = resultSummary(data.result);
  return (
    <>
      <section className="reflect-summary" aria-labelledby="reflect-title">
        <p className="eyebrow">02 / REFLECT</p>
        <h1 id="reflect-title">What we found about you</h1>
        <p className="result-explanation">{data.result.explanation}</p>
        <div className="findings-grid">
          <section className="finding-card" aria-labelledby="interests-title">
            <Compass size={21} aria-hidden="true" />
            <h2 id="interests-title">Interest themes</h2>
            {summary.interests.length > 0 ? (
              <ul className="interest-themes">
                {summary.interests.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            ) : (
              <p className="finding-value">
                {summary.neutralInterests
                  ? "No clear interest pattern yet."
                  : NOT_RECORDED}
              </p>
            )}
          </section>
          <section className="finding-card" aria-labelledby="exploration-title">
            <Lightbulb size={21} aria-hidden="true" />
            <h2 id="exploration-title">How you like to explore</h2>
            <p className="finding-value">{summary.exploration}</p>
          </section>
          <section className="finding-card" aria-labelledby="priorities-title">
            <GraduationCap size={21} aria-hidden="true" />
            <h2 id="priorities-title">What matters in a course</h2>
            {summary.priorities.length > 0 ? (
              <ul className="course-priorities">
                {summary.priorities.map((priority) => (
                  <li key={priority}>{priority}</li>
                ))}
              </ul>
            ) : (
              <p className="finding-value">{NOT_RECORDED}</p>
            )}
          </section>
        </div>
      </section>
      <section className="results-summary" aria-labelledby="directions-title">
        <div className="directions-intro">
          <h2 id="directions-title">A few directions to explore.</h2>
          <p>
            Your interests can open more than one door. Here are some starting
            points, with a small step you can try for each.
          </p>
        </div>
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
                    {i === 0 ? (
                      <Compass aria-hidden="true" />
                    ) : i === 1 ? (
                      <Lightbulb aria-hidden="true" />
                    ) : (
                      <Target aria-hidden="true" />
                    )}
                  </span>
                </div>
                <p className="category-label">{r.categoryName}</p>
                <h3>{r.title}</h3>
                <p>{r.description}</p>
                <div className="why-block">
                  <h4>Why explore this?</h4>
                  <p>{r.reason}</p>
                </div>
                {r.suggested_next_step && (
                  <div className="next-step">
                    <h4>A small first step</h4>
                    <p>{r.suggested_next_step}</p>
                  </div>
                )}
                <Link
                  className="button secondary full"
                  href={`/options/${attemptId}?category=${r.category}`}
                >
                  Explore this direction{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
      <div className="reassurance">
        <Sparkles size={22} aria-hidden="true" />
        <p>
          These are starting points for exploration, not a final career
          judgment. Your interests can change as you try new things.
        </p>
      </div>
      <div className="result-actions">
        {cards.length > 0 && (
          <Link className="button primary" href={`/options/${attemptId}`}>
            Choose a next step <ArrowRight size={16} aria-hidden="true" />
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
