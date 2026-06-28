"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type DailyIframe from "@daily-co/daily-js";
import type { DailyCall } from "@daily-co/daily-js";
import type { EvaluationReport, InterviewSetup, Turn } from "@/lib/types";
import { Report } from "../interview/report";

type Phase = "idle" | "connecting" | "live" | "evaluating" | "done" | "error";

// A Tavus conversation.utterance event delivered over Daily's app-message channel.
interface TavusUtterance {
  event_type?: string;
  properties?: { role?: string; speech?: string; text?: string };
}

export default function AvatarPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [report, setReport] = useState<EvaluationReport | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const convIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<Turn[]>([]);
  const finishingRef = useRef(false);

  // Accumulate the transcript from Tavus utterance events.
  const onAppMessage = useCallback((ev: { data?: TavusUtterance }) => {
    const d = ev?.data;
    // Temporary: log event types so we can confirm the live utterance shape.
    if (process.env.NODE_ENV !== "production") console.debug("[tavus event]", d?.event_type, d);
    if (!d || d.event_type !== "conversation.utterance") return;
    const text = d.properties?.speech ?? d.properties?.text ?? "";
    if (!text.trim()) return;
    const speaker: Turn["speaker"] =
      d.properties?.role === "user" ? "candidate" : "interviewer";
    transcriptRef.current.push({ speaker, content: text.trim() });
  }, []);

  const finish = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setPhase("evaluating");

    // Tear down the call and end the Tavus conversation.
    try {
      await callRef.current?.leave();
      callRef.current?.destroy();
    } catch {
      /* ignore */
    }
    if (convIdRef.current) {
      void fetch("/api/avatar/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: convIdRef.current }),
      });
    }

    const transcript = transcriptRef.current;
    if (transcript.length === 0) {
      setError("No speech was captured, so there's nothing to evaluate.");
      setPhase("error");
      return;
    }

    try {
      const raw = sessionStorage.getItem("interviewSetup");
      const setup = raw ? (JSON.parse(raw) as InterviewSetup) : undefined;
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup, transcript, mode: "avatar", delivery: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");
      setReport(data.report);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setPhase("error");
    }
  }, []);

  async function start() {
    setPhase("connecting");
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
      convIdRef.current = data.id;

      // Lazy-load the SDK (browser-only) and embed the prebuilt call UI.
      const Daily = (await import("@daily-co/daily-js")).default as typeof DailyIframe;
      const call = Daily.createFrame(containerRef.current!, {
        showLeaveButton: true,
        iframeStyle: { width: "100%", height: "100%", border: "0" },
      });
      callRef.current = call;
      call.on("app-message", onAppMessage);
      call.on("left-meeting", () => void finish());
      await call.join({ url: data.url });
      setPhase("live");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setPhase("error");
    }
  }

  // Clean up the call if the user navigates away mid-interview.
  useEffect(() => {
    return () => {
      try {
        callRef.current?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, []);

  if (phase === "done" && report) {
    return (
      <Report report={report} delivery={null} onRestart={() => router.push("/")} />
    );
  }

  if (phase === "error") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
        <button onClick={() => router.push("/")} className="mt-4 underline">
          Start over
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Avatar interview</h1>
        {phase === "live" && (
          <button
            onClick={() => void finish()}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:border-zinc-500 dark:border-zinc-700"
          >
            End &amp; get feedback
          </button>
        )}
      </div>

      <p className="mt-2 text-sm text-zinc-500">
        Live video interviewer via Tavus. Capped at 5 minutes to protect the free tier.
        Allow camera &amp; mic when prompted. End anytime to get your scored feedback.
      </p>

      {phase === "idle" && (
        <button
          onClick={start}
          className="mt-6 rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Start avatar interview
        </button>
      )}

      {phase === "connecting" && (
        <p className="mt-6 text-sm text-zinc-400">Connecting to your interviewer…</p>
      )}

      {phase === "evaluating" && (
        <p className="mt-6 text-sm text-zinc-400">Evaluating your interview…</p>
      )}

      {/* The Daily prebuilt call renders into this container. */}
      <div
        ref={containerRef}
        className={`mt-6 aspect-video w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 ${
          phase === "live" || phase === "connecting" ? "block" : "hidden"
        }`}
      />
    </main>
  );
}
