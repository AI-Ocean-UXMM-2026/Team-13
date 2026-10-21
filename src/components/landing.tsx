"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/frontend/api";
import { quizSchema, startResponse } from "@/lib/frontend/contracts";
import {
  type Draft,
  type EntryReason,
  loadDraft,
  save,
  sessionId,
  startKey,
  storeDraft,
} from "@/lib/frontend/storage";
import { ErrorState } from "./shared";
export default function Landing() {
  const [reason, setReason] = useState<EntryReason>();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const lock = useRef(false);
  const router = useRouter();
  useEffect(() => setDraft(loadDraft()), []);
  async function start() {
    if (!reason || lock.current) return;
    if (
      draft &&
      !window.confirm(
        "Start a new quiz? Your current unfinished answers will be replaced.",
      )
    )
      return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const { questions } = await api("/api/quiz", quizSchema);
      const response = await api("/api/quiz/start", startResponse, {
        body: { entryReason: reason },
        key: startKey(reason),
      });
      storeDraft({
        schemaVersion: 1,
        sessionId: sessionId(),
        attemptId: response.attemptId,
        entryReason: reason,
        questionIds: questions.map((q) => q.id),
        answers: {},
        currentQuestionIndex: 0,
        updatedAt: Date.now(),
      });
      save("career.pendingStart", null);
      save("career.completed", null);
      router.push("/quiz");
    } catch (e) {
      setError(e as Error);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <section className="landing-grid">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="small-line" />A LITTLE CURIOSITY. A NEW DIRECTION.
          </p>
          <h1>
            Your future starts
            <br />
            with <em>exploring.</em>
          </h1>
          <p className="hero-subtitle">
            Not sure what to study after matriculation?
          </p>
          <p className="muted">
            You don’t need to have it all figured out. Explore possible career
            directions and find one practical next step.
          </p>
          <div className="hero-meta">
            <span>◷ 20 questions, at your own pace</span>
            <span>↗ No account needed</span>
          </div>
          <div className="start-panel">
            <fieldset disabled={busy}>
              <legend>What brings you here?</legend>
              {(
                [
                  [
                    "too_many_interests",
                    "I have too many interests",
                    "Let’s find a starting point.",
                  ],
                  [
                    "not_sure_yet",
                    "I’m not sure what interests me yet",
                    "Let’s discover a few possibilities.",
                  ],
                ] as const
              ).map(([value, title, sub]) => (
                <label
                  className={`entry-option ${reason === value ? "selected" : ""}`}
                  key={value}
                >
                  <input
                    type="radio"
                    name="entry"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                  />
                  <span>
                    <strong>{title}</strong>
                    <small>{sub}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <button
              className="button primary full"
              onClick={start}
              disabled={!reason || busy}
            >
              {busy ? "Preparing your questions…" : "Start exploring"}
              <span aria-hidden>↗</span>
            </button>
            <p className="fine-print">
              A starting point for exploration. Never a final career judgment.
            </p>
          </div>
          {draft && (
            <p className="resume-note">
              Your unfinished quiz is here.{" "}
              <Link href="/quiz">Resume your progress →</Link>
            </p>
          )}
          {error && <ErrorState error={error} retry={start} />}
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-grid" />
          <span className="art-caption">THERE’S MORE THAN ONE WAY FORWARD</span>
          <svg viewBox="0 0 500 540" className="path-art">
            <path
              d="M70 465 C50 280 450 440 350 245 S100 230 220 55"
              fill="none"
              stroke="#b9d2c8"
              strokeWidth="80"
            />
            <path
              d="M70 465 C50 280 450 440 350 245 S100 230 220 55"
              fill="none"
              stroke="#f5f4eb"
              strokeWidth="2"
              strokeDasharray="7 10"
            />
            <circle cx="70" cy="465" r="13" fill="#eb947e" />
            <circle cx="220" cy="55" r="15" fill="#1d554a" />
            <path
              d="M208 58 l12 -12 12 12 M220 47 v22"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
            />
          </svg>
          <div className="floating-note note-one">
            <span className="note-icon">✳</span>
            <span>
              <small>START WITH YOURSELF</small>
              <strong>What sparks your interest?</strong>
            </span>
          </div>
          <div className="floating-note note-two">
            <span className="note-icon coral">↗</span>
            <span>
              <small>OPEN A FEW DOORS</small>
              <strong>Discover new possibilities.</strong>
            </span>
          </div>
          <div className="floating-note note-three">
            <span className="note-icon gold">✓</span>
            <span>
              <small>KEEP IT SIMPLE</small>
              <strong>One small next step.</strong>
            </span>
          </div>
          <span className="art-bottom">A direction, not a destination.</span>
        </div>
      </section>
      <section className="how-section" aria-labelledby="how-title">
        <div>
          <p className="eyebrow">LESS PRESSURE. MORE POSSIBILITY.</p>
          <h2 id="how-title">A little reflection goes a long way.</h2>
        </div>
        <div className="how-grid">
          {[
            [
              "01",
              "Tell us what draws you in",
              "Reflect on activities, interests, and how you like to learn.",
            ],
            [
              "02",
              "Meet a few possibilities",
              "Get up to three directions to explore, with reasons behind each.",
            ],
            [
              "03",
              "Try one small next step",
              "Explore a course, a demo advisor, or an activity on your own.",
            ],
          ].map(([n, title, text]) => (
            <article key={n}>
              <span className="step-number">{n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
