"use client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useRef, useState } from "react";
import { track } from "@/lib/frontend/api";
import { resourceView } from "@/lib/frontend/resource-view";
import {
  adsSchema,
  advisorsSchema,
  coursesSchema,
  recommendationViews,
  inResultOrder,
  type AreaView,
  resultSchema,
  safeExternalUrl,
} from "@/lib/frontend/contracts";
import { Empty, ErrorState, Loading, useResource } from "./shared";

function Resources({
  category,
  title,
  attemptId,
  area,
  studyOptions,
}: {
  area?: AreaView;
  studyOptions?: string[];
  category: string;
  title: string;
  attemptId: string;
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
  const placements = Object.entries(ads.data?.placements ?? {}).filter(
    ([, list]) => list.length > 0,
  );
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
      <section className="resource-section" aria-labelledby="courses-title">
        <div className="section-heading">
          <h2 id="courses-title">Learn something new</h2>
          <span className="eyebrow">COURSES</span>
        </div>
        <p className="muted">Courses for {title.toLowerCase()}.</p>
        {area &&
          studyOptions?.some((v) => v !== "not_sure") &&
          courses.data &&
          !courses.data.courses.some(
            (c) => c.study_option && studyOptions.includes(c.study_option),
          ) && (
            <p className="notice">
              No example course here matches your selected study format. These
              are alternatives to explore, not a match to your study
              requirements.
            </p>
          )}
        {courses.error ? (
          <ErrorState error={courses.error} retry={courses.retry} />
        ) : !courses.data ? (
          <Loading label="Finding course options…" />
        ) : !courses.data.courses.length ? (
          <Empty>No course options are available for this direction yet.</Empty>
        ) : (
          <div className="course-grid">
            {inResultOrder(courses.data.courses, area?.courses)
              .map(resourceView)
              .map((c) => (
                <article className="resource-card" key={c.id}>
                  <div className="resource-card-top">
                    <span className="resource-icon" aria-hidden="true">
                      <BookOpen size={20} />
                    </span>
                  </div>
                  <p className="provider">{c.provider}</p>
                  <h3>{c.title}</h3>
                  {c.is_demo && (
                    <p className="eyebrow">Example course · Fictional</p>
                  )}
                  <p className="resource-summary">{c.summary}</p>
                  <p className="price-label">{c.price_label}</p>
                  <Link
                    className="resource-action"
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
                    View course <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </article>
              ))}
          </div>
        )}
      </section>
      <section className="resource-section" aria-labelledby="advisors-title">
        <div className="section-heading">
          <h2 id="advisors-title">Talk with an advisor</h2>
          <span className="eyebrow">ADVISORS</span>
        </div>
        <p className="muted">
          Explore these example advisor profiles. Requests are stored without
          sending a message.
        </p>
        {advisors.error ? (
          <ErrorState error={advisors.error} retry={advisors.retry} />
        ) : !advisors.data ? (
          <Loading label="Finding advisor options…" />
        ) : !advisors.data.advisors.length ? (
          <Empty>
            No advisors are available for this direction yet. You can still
            explore courses or choose another direction.
          </Empty>
        ) : (
          <div className="advisor-grid">
            {inResultOrder(advisors.data.advisors, area?.advisors)
              .map(resourceView)
              .map((a) => (
                <article className="resource-card" key={a.id}>
                  <div className="resource-card-top">
                    <span className="avatar" aria-hidden="true">
                      <UserRound size={22} />
                    </span>
                  </div>
                  <h3>{a.name}</h3>
                  {a.is_demo && (
                    <p className="eyebrow">Example advisor · Fictional</p>
                  )}
                  <p className="advisor-specialty">{a.specialty}</p>
                  {a.summary && <p className="resource-summary">{a.summary}</p>}
                  <Link
                    className="resource-action"
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
                    View advisor <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </article>
              ))}
          </div>
        )}
      </section>
      <section className="community-banner" aria-labelledby="community-title">
        <span className="resource-icon" aria-hidden="true">
          <UsersRound size={22} />
        </span>
        <div>
          <h2 id="community-title">Join a community</h2>
          <p>Community connections aren’t available yet.</p>
        </div>
        <span className="coming-soon">Coming soon</span>
      </section>
      {(ads.error || !ads.data || placements.length > 0) && (
        <section
          className="options-sponsored"
          aria-labelledby="sponsored-title"
        >
          <h2 id="sponsored-title">Sponsored offers</h2>
          {ads.error ? (
            <ErrorState error={ads.error} retry={ads.retry} />
          ) : !ads.data ? (
            <Loading label="Finding sponsored offers…" />
          ) : (
            <div className="sponsored-grid">
              {placements.map(([placement, list]) => (
                <section
                  className="sponsored-placement"
                  key={placement}
                  data-placement={placement}
                  aria-label="Sponsored content"
                >
                  {list.map(resourceView).map((ad) => (
                    <article key={ad.id}>
                      <span className="sponsored-label">Sponsored</span>
                      <h3>{ad.title}</h3>
                      {ad.summary && <p>{ad.summary}</p>}
                      {ad.provider_name && (
                        <p className="provider">{ad.provider_name}</p>
                      )}

                      {safeExternalUrl(ad.url) && (
                        <a
                          className="text-link"
                          href={safeExternalUrl(ad.url)!}
                        >
                          View example offer{" "}
                          <ArrowRight size={14} aria-hidden="true" />
                        </a>
                      )}
                    </article>
                  ))}
                </section>
              ))}
            </div>
          )}
        </section>
      )}
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
  const result = resource.data.result;
  const directions = result.areas
    ? [
        ...result.areas.filter((a) => a.recommended),
        ...result.areas.filter((a) => !a.recommended),
      ].map((a) => ({ id: a.id, category: a.code, title: a.name }))
    : recommendationViews(result);
  const active =
    directions.find((r) => r.category === selected) ?? directions[0];
  return (
    <div className="options-page">
      <Link className="back-link" href={`/results/${attemptId}`}>
        <ArrowLeft size={15} aria-hidden="true" />
        Back to your directions
      </Link>
      <header className="options-intro">
        <p className="eyebrow">03 / EXPLORE</p>
        <h1>One small step. A little more clarity.</h1>
        <p>
          Choose a direction to see courses and advisors. You can switch
          anytime.
        </p>
      </header>
      {!active ? (
        <Empty>
          No directions are available. <Link href="/">Start again</Link>.
        </Empty>
      ) : (
        <>
          <section
            className="direction-selector"
            aria-labelledby="direction-title"
          >
            <h2 id="direction-title">Choose your career direction</h2>
            <div
              className="direction-tabs"
              role="group"
              aria-label="Choose an interest area"
            >
              {directions.map((r) => (
                <button
                  className={active.id === r.id ? "active" : ""}
                  key={r.id}
                  aria-pressed={active.id === r.id}
                  onClick={() => setSelected(r.category)}
                >
                  {r.title}
                  <span className="direction-check" aria-hidden="true">
                    {active.id === r.id && <Check size={16} />}
                  </span>
                </button>
              ))}
            </div>
            <p className="selected-hint">{result.nextAction.text}</p>
          </section>
          {result.areas && (
            <section
              className="resource-section"
              aria-label="Try a beginner activity"
            >
              <h2>Try a beginner activity</h2>
              <div className="career-example-grid">
                {result.areas
                  .find((a) => a.code === active.category)
                  ?.careers.filter((r) => r.activity)
                  .map((r) => (
                    <article className="career-example" key={r.id}>
                      <h3>{r.title}</h3>
                      <p>{r.activity?.title}</p>
                      <Link
                        className="button secondary"
                        href={`/explore/${r.id}?attemptId=${attemptId}`}
                        onClick={() =>
                          void track({
                            eventName: "explore_clicked",
                            attemptId,
                            metadata: { screen: "options", action: "explore" },
                          })
                        }
                      >
                        Try an activity
                      </Link>
                    </article>
                  ))}
              </div>
            </section>
          )}
          <Resources
            category={active.category}
            title={active.title}
            attemptId={attemptId}
            area={result.areas?.find((a) => a.code === active.category)}
            studyOptions={result.profile?.studyOptions}
          />
        </>
      )}
    </div>
  );
}
