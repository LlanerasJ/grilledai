import type { ReactNode } from "react";
import { Sidebar } from "@/app/sidebar";
import { AuthBar } from "@/app/auth-bar";

// Shared shell for the authed app pages (home, history): persistent sidebar
// on desktop, a compact top bar on mobile.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3.5 md:hidden dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-sm shadow-sm">
              🔥
            </span>
            <span className="font-bold tracking-tight">GrilledAI</span>
          </div>
          <AuthBar />
        </header>

        {children}
      </div>
    </div>
  );
}
