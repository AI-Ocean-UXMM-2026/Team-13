"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { track } from "@/lib/frontend/api";
import {
  adsSchema,
  advisorsSchema,
  coursesSchema,
  recommendationViews,
  resultSchema,
  safeExternalUrl,
} from "@/lib/frontend/contracts";
import {
  DemoBadge,
  Empty,
  ErrorState,
  Loading,
  PageIntro,
  useResource,
} from "./shared";
function Resources({
  category,
  attemptId,
  roleId,
}: {
  category: string;
  attemptId: string;
  roleId: string;
}) {
  const cache = useRef(new Map<string, unknown>()).current;
  const courses = useResource(
    `/api/courses?category=${category}`,
    coursesSchema,
    cache,
  );
  const advisors = useResource(
    `/api/advisors?category=${category}`,
    advisorsSchema,
    cache,
  );
  const ads = useResource(`/api/ads?category=${category}`, adsSchema, cache);
  const allFailed = courses.error && advisors.error && ads.error;
  return (
    <>
      {allFailed && (
        <div className="notice" role="alert">
          We couldn’t load these resources.{" "}
          <button
            className="text-link"
            onClick={() => {
              courses.retry();
              advisors.retry();
              ads.retry();
            }}
          >
            Retry all resources
          </button>
        </div>
      )}
      <div className="resource-layout">
        <div>
          <section className="resource-section">
            <div className="section-heading">
              <h2>Learn something new</h2>
              <span className="eyebrow">COURSES</span>
            </div>
            <p className="muted">
              A place to start, without committing to a whole path.
            </p>
            {courses.error ? (
              <ErrorState error={courses.error} retry={courses.retry} />
            ) : !courses.data ? (
              <Loading label="Finding course options…" />
            ) : !courses.data.courses.length ? (
              <Empty>
                No course options are available for this direction yet.
              </Empty>
            ) : (
              <div className="course-grid">
                {courses.data.courses.map((c) => (
                  <article className="resource-card" key={c.id}>
                    <div className="course-illustration" aria-hidden>
                      <span>↗</span>
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="resource-card-body">
                      {c.is_demo && <DemoBadge />}
                      <p className="provider">{c.provider}</p>
                      <h3>{c.title}</h3>
                      <p>{c.summary}</p>
                      <p className="price-label">{c.price_label}</p>
                      <Link
                        className="text-link"
                        href={`/course/${c.id}?attemptId=${attemptId}`}
                        onClick={() =>
                          void track({
                            eventName: "course_clicked",
                            attemptId,
                            entityId: c.id,
                            metadata: { screen: "options" },
                          })
                        }
                      >
                        View course <span aria-hidden>↗</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <section className="resource-section">
            <div className="section-heading">
              <h2>Talk it through</h2>
              <span className="eyebrow">ADVISORS</span>
            </div>
            <p className="muted">
              Example profiles for the demo. Requests are stored without sending
              a message.
            </p>
            {advisors.error ? (
              <ErrorState error={advisors.error} retry={advisors.retry} />
            ) : !advisors.data ? (
              <Loading label="Finding advisor options…" />
            ) : !advisors.data.advisors.length ? (
              <Empty>
                No advisors are available for this direction yet. You can still
                try a course or activity.
              </Empty>
            ) : (
              advisors.data.advisors.map((a) => (
                <article className="advisor-card" key={a.id}>
                  <span className="avatar" aria-hidden>
                    ◉
                  </span>
                  <div>
                    {a.is_demo && <DemoBadge />}
                    <h3>{a.name}</h3>
                    <p>{a.specialty}</p>
                    <p className="muted">{a.summary}</p>
                    <Link
                      className="text-link"
                      href={`/advisor/${a.id}?attemptId=${attemptId}`}
                      onClick={() =>
                        void track({
                          eventName: "advisor_clicked",
                          attemptId,
                          entityId: a.id,
                          metadata: { screen: "options" },
                        })
                      }
                    >
                      View advisor <span aria-hidden>↗</span>
                    </Link>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
        <aside>
          <section className="explore-card">
            <span className="big-symbol" aria-hidden>
              ✳
            </span>
            <p className="eyebrow">LEARN BY DOING</p>
            <h2>
              Give curiosity
              <br />a little room.
            </h2>
            <p>
              Try a small activity on your own. Notice what you enjoy before
              choosing what comes next.
            </p>
            <Link
              className="button primary full"
              href={`/explore/${roleId}?attemptId=${attemptId}`}
              onClick={() =>
                void track({
                  eventName: "explore_clicked",
                  attemptId,
                  metadata: { screen: "options", action: "explore" },
                })
              }
            >
              Try an activity <span aria-hidden>↗</span>
            </Link>
            <p className="fine-print">Free demo activity · No account needed</p>
          </section>
          {ads.error ? (
            <ErrorState error={ads.error} retry={ads.retry} />
          ) : (
            ads.data &&
            Object.entries(ads.data.placements).map(
              ([placement, list]) =>
                list.length > 0 && (
                  <section
                    className="sponsored-placement"
                    key={placement}
                    aria-label="Sponsored content"
                  >
                    <span className="sponsored-label">Sponsored</span>
                    {list.map((ad) => (
                      <article key={ad.id}>
                        <h3>{ad.title}</h3>
                        <p>{ad.summary}</p>
                        <p className="provider">{ad.provider_name}</p>
                        {ad.is_demo && <DemoBadge />}
                        {safeExternalUrl(ad.url) && (
                          <a
                            className="text-link"
                            href={safeExternalUrl(ad.url)!}
                          >
                            View example offer ↗
                          </a>
                        )}
                      </article>
                    ))}
                  </section>
                ),
            )
          )}
        </aside>
      </div>
    </>
  );
}
export default function Options({
  attemptId,
  initialCategory,
}: {
  attemptId: string;
  initialCategory?: string;
}) {
  const resource = useResource(`/api/results/${attemptId}`, resultSchema);
  const [selected, setSelected] = useState(initialCategory);
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.retry} />;
  if (!resource.data) return <Loading />;
  const directions = recommendationViews(resource.data.result);
  const active =
    directions.find((r) => r.category === selected) ?? directions[0];
  return (
    <>
      <Link className="back-link" href={`/results/${attemptId}`}>
        ← Back to your directions
      </Link>
      <PageIntro
        eyebrow="03 / EXPLORE"
        title="One small step. A little more clarity."
      >
        <p>
          Pick a direction, then choose how you’d like to explore it. You don’t
          have to decide everything today.
        </p>
      </PageIntro>
      {!active ? (
        <Empty>
          No directions are available. <Link href="/">Start again</Link>.
        </Empty>
      ) : (
        <>
          <div
            className="direction-tabs"
            role="group"
            aria-label="Choose a recommended direction"
          >
            {directions.map((r) => (
              <button
                className={active.id === r.id ? "active" : ""}
                key={r.id}
                aria-pressed={active.id === r.id}
                onClick={() => setSelected(r.category)}
              >
                {r.title}
                <span aria-hidden>↗</span>
              </button>
            ))}
          </div>
          <p className="selected-hint">
            {active.suggested_next_step ?? resource.data.result.nextAction.text}
          </p>
          <Resources
            category={active.category}
            attemptId={attemptId}
            roleId={active.id}
          />
        </>
      )}
    </>
  );
}
