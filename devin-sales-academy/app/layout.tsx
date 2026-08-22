import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Devin Sales Academy",
  description:
    "Learn to sell Devin: engineering fundamentals in plain English, SPIN discovery, MEDDICCC qualification, CTO role-play, objection handling, and graded practice.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SiteNav />
        <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-[var(--muted)]">
          Practice tool. Grading is deterministic and rubric-based, so the same
          answer always scores the same way. Progress is stored in this browser
          only.
        </footer>
      </body>
    </html>
  );
}
