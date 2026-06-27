"use client";

import { useState } from "react";
import type { InterviewSetup } from "@/lib/types";

// Phase 4 spike: render a live Tavus avatar interviewer in an iframe.
// Goal is only to prove the real-time video loop works in our stack.
export default function AvatarPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true);
    setError("");
    try {
      const raw = sessionStorage.getItem("interviewSetup");
      const setup = raw ? (JSON.parse(raw) as InterviewSetup) : undefined;
      const res = await fetch("/api/avatar/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start avatar");
      setUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Avatar interview (spike)</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Live video interviewer via Tavus. Each call is capped at 5 minutes to protect the
        free tier. Allow camera &amp; mic when prompted.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      {!url ? (
        <button
          onClick={start}
          disabled={loading}
          className="mt-6 rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Starting…" : "Start avatar interview"}
        </button>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <iframe
            src={url}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="aspect-video w-full"
          />
        </div>
      )}
    </main>
  );
}
