"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, RequestError } from "@/lib/frontend/api";
import {
  quizSchema,
  resultSchema,
  startResponse,
} from "@/lib/frontend/contracts";
import { interestMascots } from "@/lib/frontend/interest-mascots";
import {
  type Draft,
  compatibleDraft,
  loadDraft,
  read,
  save,
  sessionId,
  storeDraft,
  toggleSelection,
  validSelection,
} from "@/lib/frontend/storage";
import { ErrorState, Loading, PageIntro, useResource } from "./shared";

function Mascot({ src, size }: { src: string; size: number }) {
  return (
    <Image
      key={src}
      className="quiz-mascot"
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      onError={(event) => {
        event.currentTarget.style.visibility = "hidden";
      }}
    />
  );
}

export default function Quiz() {
  const resource = useResource("/api/quiz", quizSchema);
  const [draft, setDraft] = useState<Draft>();
  const [resume, setResume] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState<Error>();
  const heading = useRef<HTMLHeadingElement>(null);
  const lock = useRef(false);
  const router = useRouter();
  useEffect(() => {
    if (!resource.data) return;
    const current = loadDraft();
    if (!current) {
      try {
        const completed = JSON.parse(read("career.completed") ?? "null");
        if (
          completed?.sessionId === sessionId() &&
          typeof completed?.attemptId === "string"
        ) {
          router.replace(`/results/${completed.attemptId}`);
          return;
        }
      } catch {}
      setInvalid(true);
      return;
    }
    if (!compatibleDraft(current, resource.data.questions)) {
      setInvalid(true);
      return;
    }
    setDraft(current);
    setResume(
      current.currentQuestionIndex > 0 ||
        Object.keys(current.answers).length > 0,
    );
  }, [resource.data, router]);
  useEffect(() => {
    if (!resume) heading.current?.focus();
  }, [draft?.currentQuestionIndex, resume]);
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.retry} />;
  if (invalid)
    return (
      <div className="narrow">
        <PageIntro eyebrow="A FRESH START" title="Let’s start with today." />
        <p>
          Your draft is missing, older than seven days, or no longer matches the
          current questions.
        </p>
        <Link className="button primary" href="/">
          Restart quiz →
        </Link>
      </div>
    );
  if (!resource.data || !draft)
    return <Loading label="Getting your questions ready…" />;
  const questions = resource.data.questions;
  const q = questions[draft.currentQuestionIndex];
  const selected = draft.answers[q.id] ?? [];
  const mascots = interestMascots(q);
  const selectedOption = q.options.find((option) =>
    selected.includes(option.id),
  );
  function update(patch: Partial<Draft>) {
    const next = { ...draft!, ...patch, updatedAt: Date.now() };
    storeDraft(next);
    setDraft(next);
    setError(undefined);
  }
  function finish(attemptId: string) {
    save(
      "career.completed",
      JSON.stringify({ sessionId: sessionId(), attemptId }),
    );
    save(`career.draft.${sessionId()}`, null);
    router.push(`/results/${attemptId}`);
  }
  async function complete() {
    if (lock.current) return;
    const unanswered = questions.findIndex(
      (q) => !validSelection(q, draft!.answers[q.id] ?? []),
    );
    if (unanswered >= 0) {
      update({ currentQuestionIndex: unanswered });
      setError(
        new Error("Please answer this question before seeing your results."),
      );
      return;
    }
    lock.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const response = await api("/api/quiz/complete", resultSchema, {
        body: {
          attemptId: draft!.attemptId,
          answers: questions.map((q) => ({
            questionId: q.id,
            optionIds: draft!.answers[q.id],
          })),
        },
      });
      finish(response.attemptId);
    } catch (e) {
      if (e instanceof RequestError && e.status === 409) {
        setConflict(true);
        setError(undefined);
      } else setError(e as Error);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function useChangedAnswers() {
    if (lock.current || !draft) return;
    lock.current = true;
    setBusy(true);
    const receipt = `career.conflict.${sessionId()}.${draft.attemptId}`;
    const key = read(receipt) ?? crypto.randomUUID();
    save(receipt, key);
    try {
      const started = await api("/api/quiz/start", startResponse, {
        body: { entryReason: draft.entryReason },
        key,
      });
      // Persist the new attempt before submission so a refresh retains these answers.
      const next = {
        ...draft,
        attemptId: started.attemptId,
        updatedAt: Date.now(),
      };
      storeDraft(next);
      setDraft(next);
      setConflict(false);
      setError(undefined);
    } catch (e) {
      setError(e as Error);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (resume)
    return (
      <section className="narrow resume-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Pick up where you left off.</h1>
        <p>
          Your answers are saved on this browser. You were on question{" "}
          {draft.currentQuestionIndex + 1} of 20.
        </p>
        <button className="button primary" onClick={() => setResume(false)}>
          Resume my quiz →
        </button>
        <Link href="/" className="text-link">
          Back to start
        </Link>
      </section>
    );
  return (
    <section className="quiz-layout">
      <Link href="/" className="back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to start
      </Link>
      <div className="quiz-heading">
        <div>
          <p className="eyebrow">01 / DISCOVER</p>
          <h2>Follow your curiosity.</h2>
        </div>
        <span className="question-count">
          Question {draft.currentQuestionIndex + 1} <span>of 20</span>
        </span>
      </div>
      <p className="quiz-reassurance">
        No right or wrong answers. Choose what feels closest to you today.
      </p>
      <div className="quiz-main">
        <div className="progress-label">
          <span>Your progress</span>
          <span>
            {Math.round(((draft.currentQuestionIndex + 1) / 20) * 100)}%
          </span>
        </div>
        <progress
          max={20}
          value={draft.currentQuestionIndex + 1}
          aria-label="Quiz progress"
        />
        <h1 ref={heading} tabIndex={-1} className="question-title">
          {q.text}
        </h1>
        <p className="muted">
          {q.maxSelections === 2
            ? "Choose one or two options."
            : "Choose one option."}
        </p>
        {mascots && (
          <div className="mascot-preview">
            {selectedOption && (
              <Mascot src={mascots.get(selectedOption.id)!} size={112} />
            )}
            <p role="status" aria-live="polite" aria-atomic="true">
              {selectedOption ? (
                <>
                  <span className="sr-only">Selected: </span>
                  {selectedOption.text}
                </>
              ) : (
                "Choose an answer below."
              )}
            </p>
          </div>
        )}
        <fieldset
          className={`answer-list${mascots ? " mascot-answers" : ""}`}
          disabled={busy}
        >
          <legend className="sr-only">{q.text}</legend>
          {q.options.map((option, i) => (
            <label
              key={option.id}
              className={`answer-option ${selected.includes(option.id) ? "selected" : ""}`}
            >
              {mascots ? (
                <Mascot src={mascots.get(option.id)!} size={64} />
              ) : (
                <span className="option-letter" aria-hidden>
                  {String.fromCharCode(65 + i)}
                </span>
              )}
              <span>{option.text}</span>
              <input
                type={q.maxSelections === 1 ? "radio" : "checkbox"}
                name={q.id}
                checked={selected.includes(option.id)}
                disabled={
                  q.maxSelections === 2 &&
                  selected.length === 2 &&
                  !selected.includes(option.id)
                }
                onChange={() =>
                  update({
                    answers: {
                      ...draft.answers,
                      [q.id]: toggleSelection(q, selected, option.id),
                    },
                  })
                }
              />
            </label>
          ))}
        </fieldset>
        {conflict && (
          <div className="notice" role="alert">
            <h2>This attempt already has a saved result</h2>
            <p>
              Your current answers differ from that result. Your changed answers
              are still saved in this browser.
            </p>
            <Link href={`/results/${draft.attemptId}`} className="text-link">
              View the earlier result
            </Link>{" "}
            <button
              className="button secondary"
              disabled={busy}
              onClick={useChangedAnswers}
            >
              Use these answers in a new attempt
            </button>
            <p>
              After creating the new attempt, select “See my results” to submit
              these answers.
            </p>
          </div>
        )}
        {error && (
          <ErrorState
            error={error}
            retry={conflict ? useChangedAnswers : complete}
          />
        )}
        <div className="quiz-controls">
          <button
            className="button secondary"
            disabled={busy || draft.currentQuestionIndex === 0}
            onClick={() =>
              update({ currentQuestionIndex: draft.currentQuestionIndex - 1 })
            }
          >
            <ArrowLeft size={16} aria-hidden="true" /> Back
          </button>
          <button
            className="button primary"
            disabled={busy || conflict || !validSelection(q, selected)}
            onClick={() =>
              draft.currentQuestionIndex === 19
                ? complete()
                : update({
                    currentQuestionIndex: draft.currentQuestionIndex + 1,
                  })
            }
          >
            {busy
              ? "Finding your directions…"
              : draft.currentQuestionIndex === 19
                ? "See my results"
                : "Next question"}{" "}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="quiz-storage fine-print">
        <ShieldCheck size={14} aria-hidden="true" />
        Your answers stay on this browser for up to seven days after your last
        update.
      </p>
    </section>
  );
}
