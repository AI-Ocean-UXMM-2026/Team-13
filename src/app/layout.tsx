import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { Header, StorageNotice } from "@/components/shared";
import "./globals.css";
export const metadata: Metadata = {
  title: "Wayfinder — Find a direction worth exploring",
  description:
    "Explore possible career directions and find one small next step. Twenty questions, at your own pace.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main" tabIndex={-1}>
          <StorageNotice />
          {children}
        </main>
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="footer-identity">
              <Link className="brand" href="/">
                <Compass size={18} aria-hidden="true" /> Wayfinder
              </Link>
              <p>Small steps. Open possibilities.</p>
            </div>
            <span>Suggestions, not a final assessment</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
