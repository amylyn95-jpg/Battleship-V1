"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/learn", label: "Learn" },
  { href: "/roleplay", label: "Role-play" },
  { href: "/objections", label: "Objections" },
  { href: "/demo-coach", label: "Demo coach" },
  { href: "/debrief", label: "Call debrief" },
  { href: "/progress", label: "Progress" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Devin Sales Academy
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          className="btn-secondary md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-[var(--border)] px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
