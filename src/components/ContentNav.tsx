import Link from "next/link";

export default function ContentNav() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-5 text-sm uppercase tracking-[0.18em] text-white mix-blend-difference">
      <Link href="/">zhanbo.art</Link>
      <div className="flex gap-5">
        <Link href="/journal">Journal</Link>
        <Link href="/notes">Notes</Link>
        <Link href="/photos">Photos</Link>
        <Link href="/archive">Archive</Link>
      </div>
    </nav>
  );
}
