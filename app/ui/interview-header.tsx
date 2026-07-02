"use client";

import type { ReactNode } from "react";

// Shared sticky header for the interview screens (text + avatar): brand mark,
// role/context on the left, status chips + actions on the right — all one height.
export function InterviewHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode; // right-side chips / actions
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/70">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-sm shadow-sm">
            🔥
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{title}</p>
            {subtitle && (
              <p className="truncate text-xs leading-tight text-zinc-500">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

// Small status chip used next to the header actions (question count, timer).
export function HeaderChip({ children }: { children: ReactNode }) {
  return (
    <span className="hidden h-9 items-center gap-1.5 rounded-lg bg-zinc-100 px-3 text-xs font-medium tabular-nums text-zinc-600 sm:inline-flex dark:bg-zinc-900 dark:text-zinc-400">
      {children}
    </span>
  );
}
