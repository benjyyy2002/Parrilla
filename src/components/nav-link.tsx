"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const active = usePathname().startsWith(href);
  return (
    <Link
      href={href}
      className={`relative py-1 font-display text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
        active ? "text-volt" : "text-muted hover:text-fg"
      }`}
    >
      {children}
      {active && <span className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-volt shadow-[0_0_12px_var(--color-volt)]" />}
    </Link>
  );
}
