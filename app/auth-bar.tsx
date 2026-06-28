"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Small header showing the signed-in user with a sign-out action.
export function AuthBar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  if (!email) return null;

  return (
    <div className="flex items-center justify-end gap-3 text-sm text-zinc-500">
      <a href="/history" className="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100">
        History
      </a>
      <span className="truncate">{email}</span>
      <form action="/auth/signout" method="post">
        <button className="rounded-md border border-zinc-300 px-2.5 py-1 hover:border-zinc-500 dark:border-zinc-700">
          Sign out
        </button>
      </form>
    </div>
  );
}
