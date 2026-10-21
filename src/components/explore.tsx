"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { activities } from "@/lib/frontend/activities";
import { resultSchema } from "@/lib/frontend/contracts";
import { read, save, sessionId } from "@/lib/frontend/storage";
import {
  Back,
  DemoBadge,
  Empty,
  ErrorState,
  Loading,
  PageIntro,
  useResource,
} from "./shared";
export default function Explore({
  roleId,
  attemptId,
}: {
  roleId: string;
  attemptId?: string;
}) {
  const resource = useResource(
    attemptId ? `/api/results/${attemptId}` : null,
    resultSchema,
  );
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDone(
      read(`career.activity.${sessionId()}.${attemptId}.${roleId}`) === "done",
    );
  }, [attemptId, roleId]);
  if (!attemptId)
    return (
      <Empty>
        Open this activity from your results.{" "}
        <Link href="/">Start exploring</Link>.
      </Empty>
    );
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.retry} />;
  if (!resource.data) return <Loading />;
  const role = resource.data.result.recommendations.find(
    (r) => r.id === roleId,
  );
  const activity = activities[roleId];
  if (!role || !activity)
    return (
      <Empty>
        This activity is not available for these results.{" "}
        <Back attemptId={attemptId} />
      </Empty>
    );
  return (
    <div className="explore-layout">
      <Back attemptId={attemptId} />
      <PageIntro eyebrow="LEARN BY DOING" title={activity.title}>
        <p>
          A small way to explore {role.title.toLowerCase()}, without committing
          to a career.
        </p>
      </PageIntro>
      <div className="activity-meta">
        <DemoBadge />
        <span>About {activity.minutes} minutes</span>
        <span>At your own pace</span>
      </div>
      <div className="activity-grid">
        <section className="activity-instructions">
          <h2>Give it a try.</h2>
          <ol>
            {activity.steps.map((step, i) => (
              <li key={step}>
                <span aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>
        <aside className="reflection-card">
          <span className="big-symbol" aria-hidden>
            ✧
          </span>
          <h2>A moment to reflect.</h2>
          <p>You don’t need to write anything here. Just notice:</p>
          <ul>
            <li>What did you enjoy?</li>
            <li>What felt difficult?</li>
            <li>Would you try something similar again?</li>
          </ul>
          <p className="fine-print">
            Your reflections are yours. We don’t collect them.
          </p>
        </aside>
      </div>
      <div className="activity-finish">
        {done ? (
          <div role="status">
            <h2>One small step, taken.</h2>
            <p>
              Marked complete in this browser only. This is not saved to your
              backend results.
            </p>
            <Link className="button primary" href={`/options/${attemptId}`}>
              Explore another next step →
            </Link>
          </div>
        ) : (
          <>
            <button
              className="button primary"
              onClick={() => {
                save(
                  `career.activity.${sessionId()}.${attemptId}.${roleId}`,
                  "done",
                );
                setDone(true);
              }}
            >
              Mark this step complete <span aria-hidden>✓</span>
            </button>
            <p className="fine-print">
              Completion is saved only in this browser.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
