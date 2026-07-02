"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type DailyIframe from "@daily-co/daily-js";
import type { DailyCall } from "@daily-co/daily-js";
import type { EvaluationReport, InterviewSetup, Turn } from "@/lib/types";
import { Button } from "@/app/ui/button";
import { HeaderChip, InterviewHeader } from "@/app/ui/interview-header";
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
  const [setup, setSetup] = useState<InterviewSetup | null>(null);

  // Load the setup once so the header can show role/type.
  useEffect(() => {
    const raw = sessionStorage.getItem("interviewSetup");
    if (raw) setSetup(JSON.parse(raw) as InterviewSetup);
  }, []);

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
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push("/")}>
          Start over
        </Button>
      </main>
    );
  }

  if (phase === "evaluating") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 dark:bg-black">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-zinc-200 border-t-orange-600 dark:border-zinc-800 dark:border-t-orange-500" />
        <div className="text-center">
          <p className="font-semibold">Grading your interview…</p>
          <p className="mt-1 text-sm text-zinc-500">
            Scoring every answer against the rubric. This takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <InterviewHeader
        title={setup?.role ?? "Avatar interview"}
        subtitle="Live video interview"
      >
        <HeaderChip>
          <span
            className={`h-2 w-2 rounded-full ${
              phase === "live" ? "animate-pulse bg-red-500" : "bg-zinc-400"
            }`}
          />
          {phase === "live" ? "Live" : phase === "connecting" ? "Connecting" : "Ready"}
        </HeaderChip>
        {phase === "live" && (
          <Button variant="secondary" size="sm" onClick={() => void finish()}>
            End &amp; get feedback
          </Button>
        )}
      </InterviewHeader>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {phase === "idle" && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-2xl shadow-sm">
              🎥
            </span>
            <h1 className="mt-5 text-xl font-bold tracking-tight">
              Face-to-face with your interviewer
            </h1>
            <p className="mt-2 max-w-md text-sm text-zinc-500">
              A live video interviewer will greet you and ask questions grounded in your
              role. Allow camera &amp; mic when prompted. Sessions are capped at 5 minutes —
              end anytime to get your scored feedback.
            </p>
            <Button size="lg" className="mt-6" onClick={start}>
              Start avatar interview
            </Button>
          </div>
        )}

        {phase === "connecting" && (
          <div className="flex items-center justify-center gap-3 py-4 text-sm text-zinc-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-orange-600 dark:border-zinc-700 dark:border-t-orange-500" />
            Connecting to your interviewer…
          </div>
        )}

        {/* The Daily prebuilt call renders into this container. */}
        <div
          ref={containerRef}
          className={`aspect-video w-full overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-sm dark:border-zinc-800 ${
            phase === "live" || phase === "connecting" ? "block" : "hidden"
          }`}
        />
      </main>
    </div>
  );
}
