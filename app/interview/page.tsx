"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type {
  AnswerDelivery,
  EvaluationReport,
  InterviewSetup,
  Turn,
} from "@/lib/types";
import { aggregate, analyzeAnswer } from "@/lib/delivery";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { Report } from "./report";

type Phase = "loading" | "interviewing" | "evaluating" | "done" | "error";

export default function InterviewPage() {
  const router = useRouter();
  const [setup, setSetup] = useState<InterviewSetup | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [error, setError] = useState("");
  const startedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Voice input + delivery analytics (Phase 2).
  const sr = useSpeechRecognition();
  const [deliveries, setDeliveries] = useState<AnswerDelivery[]>([]);
  const baseRef = useRef(""); // textarea text captured when the mic started
  const voiceStartRef = useRef<number | null>(null);

  // While listening, stream recognized speech into the answer box.
  useEffect(() => {
    if (sr.listening) setInput(baseRef.current + sr.transcript + sr.interim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sr.transcript, sr.interim, sr.listening]);

  function toggleMic() {
    if (sr.listening) {
      sr.stop();
      return;
    }
    baseRef.current = input.trim() ? input.trim() + " " : "";
    voiceStartRef.current = Date.now();
    sr.start();
  }

  // Load setup and kick off the first interviewer message.
  useEffect(() => {
    const raw = sessionStorage.getItem("interviewSetup");
    if (!raw) {
      router.replace("/");
      return;
    }
    const s = JSON.parse(raw) as InterviewSetup;
    setSetup(s);
    if (startedRef.current) return;
    startedRef.current = true;
    void advance(s, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, phase]);

  // Ask the interviewer for its next message given the transcript so far.
  async function advance(s: InterviewSetup, history: Turn[]) {
    setBusy(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup: s, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Interview request failed");
      setTurns([...history, { speaker: "interviewer", content: data.message }]);
      setPhase(data.done ? "evaluating" : "interviewing");
      if (data.done) void evaluate(s, [...history, { speaker: "interviewer", content: data.message }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setPhase("error");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer() {
    if (!setup || !input.trim() || busy) return;
    const answer = input.trim();

    // If this answer was (partly) spoken, record delivery metrics for it.
    if (sr.listening) sr.stop();
    const dur =
      sr.durationSec > 0
        ? sr.durationSec
        : voiceStartRef.current
          ? (Date.now() - voiceStartRef.current) / 1000
          : 0;
    if (dur > 0) {
      setDeliveries((d) => [...d, analyzeAnswer(answer, dur)]);
    }
    voiceStartRef.current = null;
    sr.reset();

    const next = [...turns, { speaker: "candidate" as const, content: answer }];
    setTurns(next);
    setInput("");
    await advance(setup, next);
  }

  async function endInterview() {
    if (!setup || busy) return;
    setPhase("evaluating");
    await evaluate(setup, turns);
  }

  async function evaluate(s: InterviewSetup, transcript: Turn[]) {
    setBusy(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup: s, transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");
      setReport(data.report);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setPhase("error");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "error") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
        <button onClick={() => router.push("/")} className="mt-4 underline">
          Start over
        </button>
      </main>
    );
  }

  if (phase === "done" && report) {
    return (
      <Report
        report={report}
        delivery={deliveries.length ? aggregate(deliveries) : null}
        onRestart={() => router.push("/")}
      />
    );
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col px-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">{setup?.role} — mock interview</h1>
        <button
          onClick={endInterview}
          disabled={busy || turns.length === 0}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:border-zinc-500 disabled:opacity-40 dark:border-zinc-700"
        >
          End &amp; get feedback
        </button>
      </div>

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto">
        {turns.map((t, i) => (
          <div
            key={i}
            className={`flex ${t.speaker === "candidate" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                t.speaker === "candidate"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              }`}
            >
              {t.content}
            </div>
          </div>
        ))}
        {(busy || phase === "loading") && (
          <div className="text-sm text-zinc-400">
            {phase === "evaluating" ? "Evaluating your interview…" : "…"}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {phase === "interviewing" && (
        <div className="mt-4 flex items-end gap-2">
          {sr.supported && (
            <button
              onClick={toggleMic}
              title={sr.listening ? "Stop recording" : "Answer with your voice"}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-lg transition ${
                sr.listening
                  ? "animate-pulse border-red-500 bg-red-500 text-white"
                  : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700"
              }`}
            >
              {sr.listening ? "■" : "🎤"}
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submitAnswer();
              }
            }}
            rows={2}
            placeholder={
              sr.listening
                ? "Listening… speak your answer"
                : "Type or speak your answer… (Enter to send, Shift+Enter for newline)"
            }
            className="flex-1 resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            onClick={submitAnswer}
            disabled={busy || !input.trim()}
            className="h-11 rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Send
          </button>
        </div>
      )}
    </main>
  );
}
