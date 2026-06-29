"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DottedSurface } from "../dotted-surface";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        // Email confirmation is enabled on the project.
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    }
    setBusy(false);
  }

  return (
    <div className="relative min-h-screen">
      <DottedSurface />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-8 shadow-xl backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-base shadow-sm">
              🔥
            </span>
            <h1 className="text-2xl font-bold tracking-tight">GrilledAI</h1>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            {mode === "signin" ? "Sign in to continue." : "Create an account to get started."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-900/80 dark:focus:border-orange-500"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 characters)"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-900/80 dark:focus:border-orange-500"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {notice && <p className="text-sm text-green-600">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-lg bg-orange-600 font-medium text-white shadow-sm transition hover:bg-orange-500 disabled:opacity-40"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setNotice("");
            }}
            className="mt-4 text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            {mode === "signin"
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </main>
    </div>
  );
}
