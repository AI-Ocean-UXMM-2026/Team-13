"use client";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Compass,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/frontend/api";
import { quizSchema, startResponse } from "@/lib/frontend/contracts";
import {
  type Draft,
  type EntryReason,
  loadDraft,
  read,
  save,
  sessionId,
  startKey,
  storeDraft,
} from "@/lib/frontend/storage";
import { ErrorState } from "./shared";
import { CompanionGallery } from "./companion-gallery";
export default function Landing() {
  const [reason, setReason] = useState<EntryReason>();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [latest, setLatest] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const lock = useRef(false);
  const router = useRouter();
  useEffect(() => {
    setDraft(loadDraft());
    try {
      const saved = JSON.parse(read("career.completed") ?? "null");
      if (
        saved?.sessionId === sessionId() &&
        typeof saved.attemptId === "string" &&
        /^[0-9a-f-]{36}$/i.test(saved.attemptId)
      )
        setLatest(saved.attemptId);
    } catch {}
  }, []);
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
    <div className="landing">
      <div className="landing-intro">
        <section className="hero-copy" aria-labelledby="hero-title">
          <h1 id="hero-title">
            Your future doesn’t have to be a <span>guessing game.</span>
          </h1>
          <p className="hero-subtitle">
            Explore your interests, discover career possibilities, and find your{" "}
            <mark>smallest and simple next step</mark> with Wayfinder.
          </p>
        </section>

        <section
          className="how-section"
          id="how-it-works"
          aria-labelledby="how-title"
        >
          <h2 id="how-title">Three steps to clarity</h2>
          <div className="how-grid">
            {[
              {
                Icon: Lightbulb,
                title: "Discover",
                text: "Reflect on your interests and how you like to learn.",
              },
              {
                Icon: Compass,
                title: "Reflect",
                text: "Explore your interest areas and several example careers within each.",
              },
              {
                Icon: ArrowRight,
                title: "Explore",
                text: "Try a useful activity and explore courses and advisors.",
              },
            ].map(({ Icon, title, text }, i) => (
              <article key={title}>
                <div className="how-card-top">
                  <span className="step-number">{i + 1}</span>
                  <h3>{title}</h3>
                  <Icon size={18} aria-hidden="true" />
                </div>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <div className="hero-meta">
          <span>
            <Clock size={14} aria-hidden="true" />
            20 questions, at your own pace
          </span>
          <span>
            <ShieldCheck size={14} aria-hidden="true" />
            No account needed
          </span>
        </div>
      </div>

      <CompanionGallery />

      <section
        className="start-section"
        id="start"
        aria-labelledby="start-title"
      >
        <div className="section-intro">
          <h2 id="start-title">Which best describes you right now?</h2>
          <p className="muted">
            Select the option that best fits your current career thoughts.
          </p>
        </div>
        <div className="start-panel">
          <fieldset disabled={busy}>
            <legend className="sr-only">What brings you here?</legend>
            {(
              [
                [
                  "not_sure_yet",
                  "I’m not sure what interests me yet",
                  "Let’s discover a few possibilities.",
                ],
                [
                  "too_many_interests",
                  "I have too many interests",
                  "Let’s find a starting point.",
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
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          <p className="fine-print">
            Complete the quiz to discover your companion. A starting point for
            exploration. Never a final career judgment.
          </p>
        </div>
        {latest && (
          <p className="resume-note">
            <Link href={`/results/${latest}`}>
              Return to my latest results →
            </Link>
          </p>
        )}
        {draft && (
          <p className="resume-note">
            Your unfinished quiz is here.{" "}
            <Link href="/quiz">Resume your progress →</Link>
          </p>
        )}
        {error && <ErrorState error={error} retry={start} />}
      </section>
    </div>
  );
}
