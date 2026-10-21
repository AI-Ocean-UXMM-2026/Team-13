"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { z } from "zod";
import { api, RequestError } from "@/lib/frontend/api";
import { resetSession, storageUnavailable } from "@/lib/frontend/storage";
export function useResource<T>(
  path: string | null,
  schema: z.ZodType<T>,
  cache?: Map<string, unknown>,
) {
  const [state, setState] = useState<{
    path: string | null;
    data?: T;
    error?: Error;
  }>({ path: null });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    const cached = cache?.get(path) as T | undefined;
    if (cached) {
      setState({ path, data: cached });
      return;
    }
    setState({ path });
    api(path, schema, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          cache?.set(path, data);
          setState({ path, data });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ path, error });
      });
    return () => controller.abort();
  }, [path, schema, revision, cache]);
  return {
    data: state.path === path ? state.data : undefined,
    error: state.path === path ? state.error : undefined,
    retry: () => {
      if (path) cache?.delete(path);
      setRevision((v) => v + 1);
    },
  };
}
export function Header() {
  const path = usePathname();
  const step =
    path === "/quiz"
      ? 1
      : path.startsWith("/results")
        ? 2
        : path === "/"
          ? 0
          : 3;
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Wayfinder home">
        <span className="brand-mark">↗</span>wayfinder
        <span className="brand-dot">.</span>
      </Link>
      <nav aria-label="Your journey" className="journey">
        {["Discover", "Reflect", "Explore"].map((label, i) => (
          <span key={label} className={step === i + 1 ? "current" : ""}>
            <b>{String(i + 1).padStart(2, "0")}</b>
            {label}
          </span>
        ))}
      </nav>
      <span className="demo-tag">LOCAL DEMO</span>
    </header>
  );
}
export function StorageNotice() {
  const [warning, setWarning] = useState(false);
  useEffect(() => {
    const update = () => setWarning(storageUnavailable());
    update();
    window.addEventListener("career-storage-warning", update);
    return () => window.removeEventListener("career-storage-warning", update);
  }, []);
  return warning ? (
    <p className="notice" role="status">
      Browser storage is unavailable. You can continue, but progress may not
      survive a refresh.
    </p>
  ) : null;
}
export function Loading({
  label = "Finding your next step…",
}: {
  label?: string;
}) {
  return (
    <div className="loading" role="status">
      <span className="loading-dot" />
      {label}
      <div className="skeleton" />
      <div className="skeleton short" />
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), [error]);
  return (
    <div className="error-panel" role="alert" tabIndex={-1} ref={ref}>
      <h2>Let’s try that again</h2>
      <p>{error.message}</p>
      <div className="actions">
        {retry && (
          <button className="button secondary" onClick={retry}>
            Retry
          </button>
        )}
        <Link href="/" className="text-link">
          Back to start
        </Link>
        {error instanceof RequestError && error.status === 410 && (
          <button
            className="button secondary"
            onClick={() => {
              resetSession();
              window.location.assign("/");
            }}
          >
            Start a new session
          </button>
        )}
      </div>
    </div>
  );
}
export function DemoBadge() {
  return <span className="badge">Demo example</span>;
}
export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <div className="intro-copy">{children}</div>}
    </div>
  );
}
export function Back({ attemptId }: { attemptId?: string }) {
  return (
    <Link
      className="back-link"
      href={attemptId ? `/options/${attemptId}` : "/"}
    >
      ← {attemptId ? "Back to your options" : "Back to start"}
    </Link>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="empty">{children}</p>;
}
