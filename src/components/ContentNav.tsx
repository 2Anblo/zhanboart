"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function ContentNav() {
  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-5 text-sm uppercase tracking-[0.18em]"
      style={{ color: "var(--nav-text, #fff)", mixBlendMode: "difference" }}
    >
      <Link href="/" className="no-underline" style={{ color: "inherit" }}>
        zhanbo.art
      </Link>
      <div className="flex items-center gap-5">
        <Link href="/journal" className="no-underline" style={{ color: "inherit" }}>Journal</Link>
        <Link href="/notes" className="no-underline" style={{ color: "inherit" }}>Notes</Link>
        <Link href="/photos" className="no-underline" style={{ color: "inherit" }}>Photos</Link>
        <Link href="/music" className="no-underline" style={{ color: "inherit" }}>Music</Link>
        <Link href="/archive" className="no-underline" style={{ color: "inherit" }}>Archive</Link>
        <div className="ml-2">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
