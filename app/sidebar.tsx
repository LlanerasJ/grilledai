"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d={path} />
    </svg>
  );
}

const NAV = [
  // New interview (plus-in-square)
  { href: "/", label: "New interview", icon: "M12 8v8M8 12h8M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" },
  // History (clock + rotate)
  { href: "/history", label: "History", icon: "M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8M12 7v5l3 2" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-white px-3 py-5 md:flex dark:border-zinc-800 dark:bg-zinc-950">
      {/* brand */}
      <div className="flex items-center gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-base shadow-sm">
          🔥
        </span>
        <span className="font-bold tracking-tight">GrilledAI</span>
      </div>

      {/* nav */}
      <nav className="mt-7 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              <Icon path={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* account */}
      <div className="mt-auto border-t border-zinc-200 pt-4 dark:border-zinc-800">
        {email && (
          <p className="truncate px-3 pb-2 text-xs text-zinc-400" title={email}>
            {email}
          </p>
        )}
        <form action="/auth/signout" method="post">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
            <Icon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
