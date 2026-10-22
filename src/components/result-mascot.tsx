"use client";

import Image from "next/image";
import { Download, Share2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ResultView } from "@/lib/frontend/contracts";
import {
  mascotArt,
  mascotCard,
  mascotChoiceKey,
  mascotOptions,
  selectedMascot,
  type ResultMascot,
} from "@/lib/frontend/result-mascots";
import { read, save, sessionId } from "@/lib/frontend/storage";

function Artwork({ mascot }: { mascot: ResultMascot }) {
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  return (
    <div className="companion-art">
      {failed ? (
        <div className="companion-art-fallback" role="status">
          <Sparkles size={38} aria-hidden="true" />
          <p>
            {mascot.name}’s illustration couldn’t load. Your companion and
            results are still here.
          </p>
          <button
            className="text-link"
            onClick={() => {
              setFailed(false);
              setRevision((n) => n + 1);
            }}
          >
            Retry illustration
          </button>
        </div>
      ) : (
        <Image
          key={revision}
          src={
            revision
              ? `${mascotArt(mascot)}?retry=${revision}`
              : mascotArt(mascot)
          }
          alt={mascot.alt}
          width={768}
          height={768}
          unoptimized
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function ShareControls({ mascot }: { mascot: ResultMascot }) {
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState<{ file: File; canShare: boolean }>();
  const [loadError, setLoadError] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [sharing, setSharing] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setReady(undefined);
    setLoadError(false);
    setShareError(false);
    void (async () => {
      try {
        const response = await fetch(mascotCard(mascot), {
          signal: controller.signal,
          cache: revision ? "reload" : "default",
        });
        if (
          !response.ok ||
          !response.headers.get("content-type")?.startsWith("image/png")
        )
          throw Error("Unavailable image");
        const blob = await response.blob();
        const file = new File([blob], `wayfinder-${mascot.id}.png`, {
          type: "image/png",
        });
        let canShare = false;
        try {
          canShare =
            typeof navigator.share === "function" &&
            navigator.canShare?.({ files: [file] }) === true;
        } catch {
          /* Download remains available if the share policy blocks files. */
        }
        if (!controller.signal.aborted) setReady({ file, canShare });
      } catch {
        if (!controller.signal.aborted) setLoadError(true);
      }
    })();
    return () => controller.abort();
  }, [mascot, revision]);

  async function share() {
    if (!ready?.canShare || lock.current) return;
    lock.current = true;
    setSharing(true);
    setShareError(false);
    try {
      // The file is prepared before this click, preserving transient activation.
      await navigator.share({
        files: [ready.file],
        title: `${mascot.name} — Wayfinder`,
        text: "Meet my Wayfinder exploration companion.",
      });
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setShareError(true);
    } finally {
      lock.current = false;
      setSharing(false);
    }
  }
  return (
    <div className="companion-sharing">
      <div className="companion-actions">
        {ready ? (
          <a
            className="button primary"
            href={mascotCard(mascot)}
            download={`wayfinder-${mascot.id}.png`}
          >
            <Download size={16} aria-hidden="true" /> Download PNG
          </a>
        ) : (
          <button className="button primary" disabled>
            <Download size={16} aria-hidden="true" /> Download PNG
          </button>
        )}
        {ready?.canShare && (
          <button
            className="button secondary"
            disabled={sharing}
            onClick={() => void share()}
          >
            <Share2 size={16} aria-hidden="true" />
            {sharing ? "Opening sharing…" : "Share image"}
          </button>
        )}
      </div>
      {loadError ? (
        <p className="companion-share-note" role="alert">
          Your share card couldn’t load.{" "}
          <button
            className="text-link"
            onClick={() => setRevision((n) => n + 1)}
          >
            Retry share image
          </button>
        </p>
      ) : !ready ? (
        <p className="companion-share-note" role="status">
          Preparing your share image…
        </p>
      ) : (
        <p className="companion-share-note">
          A square image for your feed or messages.{" "}
          {ready.canShare
            ? "Choose an app from your device’s share menu."
            : "Download it to post in your favorite app."}
        </p>
      )}
      {shareError && (
        <p className="companion-share-note" role="alert">
          Sharing couldn’t open. You can still download your PNG.
        </p>
      )}
    </div>
  );
}

export default function ResultMascotHero({
  result,
  attemptId,
}: {
  result: ResultView;
  attemptId: string;
}) {
  const { mode, options } = mascotOptions(result);
  const [choice, setChoice] = useState<string | null>(null);
  const storageKey = useRef<string>(undefined);
  useEffect(() => {
    storageKey.current = mascotChoiceKey(sessionId(), attemptId);
    setChoice(read(storageKey.current));
  }, [attemptId]);
  const selected = selectedMascot(options, choice);
  const style = selected
    ? ({
        "--companion-color": selected.color,
        "--companion-tint": selected.tint,
      } as CSSProperties)
    : undefined;
  return (
    <section
      className="result-companion"
      style={style}
      aria-labelledby="companion-title"
    >
      <header className="companion-intro">
        <span className="companion-eyebrow">
          <Sparkles size={15} aria-hidden="true" /> A LITTLE MYTH. A NEW
          POSSIBILITY.
        </span>
        <h2 id="companion-title">
          {selected
            ? "Meet your exploration companion"
            : "Choose your exploration companion"}
        </h2>
        <p>
          {mode === "choice"
            ? "There isn’t a clear leading interest in these results. Pick a companion for fun as you explore what comes next."
            : mode === "tied"
              ? "Several themes show equally strong interest. Choose a companion from those themes."
              : "A character inspired by your strongest relative interest, ready for your next small step."}
        </p>
      </header>
      {selected && (
        <div className="companion-showcase" data-mascot={selected.id}>
          <Artwork key={selected.id} mascot={selected} />
          <div className="companion-details">
            <p className="companion-personality">{selected.title}</p>
            <h3>
              {selected.name}{" "}
              <span lang="my" className="companion-burmese">
                {selected.burmeseName}
              </span>
            </h3>
            <p className="companion-tagline">{selected.tagline}.</p>
            <p className="companion-description">{selected.description}</p>
            <p className="companion-match">
              {mode === "choice"
                ? "You chose this companion for exploration. It isn’t an assessment of your interests."
                : `${selected.interest} is ${mode === "tied" ? "one of your strongest relative interests" : "your strongest relative interest"}. Companions compare each theme against its available points.`}
            </p>
            <ShareControls key={selected.id} mascot={selected} />
          </div>
        </div>
      )}
      {options.length > 1 && (
        <fieldset className="companion-picker">
          <legend>
            {mode === "tied"
              ? "Choose from your leading themes"
              : "Pick a companion to explore with"}
          </legend>
          <div className="companion-choices">
            {options.map((mascot) => (
              <label className="companion-option" key={mascot.id}>
                <input
                  type="radio"
                  name="result-companion"
                  value={mascot.id}
                  checked={selected?.id === mascot.id}
                  onChange={() => {
                    setChoice(mascot.id);
                    save(
                      storageKey.current ??
                        mascotChoiceKey(sessionId(), attemptId),
                      mascot.id,
                    );
                  }}
                />
                <Image
                  src={mascotArt(mascot)}
                  alt=""
                  width={60}
                  height={60}
                  unoptimized
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />
                <span>
                  <strong>{mascot.name}</strong>
                  <span lang="my" className="companion-burmese">
                    {mascot.burmeseName}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {!selected && (
        <div className="companion-before-choice">
          <button className="button primary" disabled>
            <Download size={16} aria-hidden="true" /> Download PNG
          </button>
          <p>Choose your companion to prepare a share card.</p>
        </div>
      )}
      <p className="companion-footnote">
        Inspired by Myanmar folklore and visual traditions. These personality
        associations are original Wayfinder interpretations.
      </p>
    </section>
  );
}
