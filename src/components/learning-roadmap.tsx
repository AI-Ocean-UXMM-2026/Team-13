"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Flag, Lightbulb, Wrench } from "lucide-react";
import { track } from "@/lib/frontend/api";
import type { CourseView } from "@/lib/frontend/contracts";
import { learningRoadmap } from "@/lib/frontend/learning-roadmap";

export default function LearningRoadmap({
  role,
  attemptId,
  courses,
  error,
  retry,
}: {
  role: { id: string; category_id: string; category: string; title: string };
  attemptId: string;
  courses?: CourseView[];
  error?: Error;
  retry: () => void;
}) {
  const path = learningRoadmap(role.id, role.category_id, courses ?? []);
  return (
    <section
      className="learning-roadmap"
      aria-label={`Learning path for ${role.title}`}
    >
      <div className="roadmap-heading">
        <Flag size={16} aria-hidden="true" />
        <h4>Your learning path</h4>
      </div>
      <p className="roadmap-hint">A suggested order. Jump in anywhere.</p>
      <ol className="roadmap-stops">
        {path.activity && (
          <li className="roadmap-stop">
            <Link
              className="roadmap-link"
              href={`/explore/${role.id}?attemptId=${attemptId}`}
              onClick={() =>
                void track({
                  eventName: "explore_clicked",
                  attemptId,
                  metadata: { screen: "results", action: "explore" },
                })
              }
            >
              <span className="roadmap-node" aria-hidden="true">
                <Lightbulb size={23} />
              </span>
              <span className="roadmap-copy">
                <span className="roadmap-kicker">Try it out</span>
                <strong>{path.activity.title}</strong>
                <span>
                  Beginner activity · About {path.activity.minutes} min
                </span>
              </span>
            </Link>
          </li>
        )}
        {error ? (
          <li className="roadmap-status">
            <p role="alert">
              Courses couldn’t load. You can still explore this direction.
            </p>
            <button className="text-link" onClick={retry}>
              Retry courses
            </button>
          </li>
        ) : !courses ? (
          <li className="roadmap-status">
            <p role="status">Finding course stops…</p>
          </li>
        ) : !path.courses.length ? (
          <li className="roadmap-status">
            <p>No course options are available for this direction yet.</p>
          </li>
        ) : (
          path.courses.map((course) => (
            <li className="roadmap-stop" key={course.id}>
              <Link
                className="roadmap-link roadmap-course"
                href={`/course/${course.id}?attemptId=${attemptId}`}
                onClick={() =>
                  void track({
                    eventName: "course_clicked",
                    attemptId,
                    entityId: course.id,
                    metadata: { screen: "results" },
                  })
                }
              >
                <span className="roadmap-node" aria-hidden="true">
                  {course.study_option === "vocational_training" ? (
                    <Wrench size={23} />
                  ) : (
                    <BookOpen size={23} />
                  )}
                </span>
                <span className="roadmap-copy">
                  <span className="roadmap-kicker">
                    {course.study_option === "vocational_training"
                      ? "Get hands-on"
                      : "Learn something new"}
                  </span>
                  <strong className="roadmap-course-title">
                    {course.title}
                  </strong>
                  <span>{course.provider}</span>
                  <span className="roadmap-price">{course.price_label}</span>
                  {course.is_demo && (
                    <span className="roadmap-demo">
                      Fictional example course
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))
        )}
        <li className="roadmap-stop roadmap-finish">
          <Link
            className="roadmap-link"
            href={`/options/${attemptId}?category=${role.category}`}
            aria-label="Explore this direction"
          >
            <span className="roadmap-node" aria-hidden="true">
              <Flag size={23} />
            </span>
            <span className="roadmap-copy">
              <span className="roadmap-kicker">Keep exploring</span>
              <strong>
                Explore this direction{" "}
                <ArrowRight size={15} aria-hidden="true" />
              </strong>
              <span>More courses, advisors & possibilities</span>
            </span>
          </Link>
        </li>
      </ol>
    </section>
  );
}
