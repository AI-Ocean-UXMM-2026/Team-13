"use client";
import { ErrorState } from "@/components/shared";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      error={
        new Error(
          "This page could not be opened. Your quiz draft is kept in this browser.",
        )
      }
      retry={reset}
    />
  );
}
