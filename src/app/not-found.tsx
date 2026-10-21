import Link from "next/link";
export default function NotFound() {
  return (
    <section className="narrow">
      <p className="eyebrow">A DIFFERENT DIRECTION</p>
      <h1>This page has wandered off.</h1>
      <p>Head back to start and find your next step.</p>
      <Link href="/" className="button primary">
        Back to start →
      </Link>
    </section>
  );
}
