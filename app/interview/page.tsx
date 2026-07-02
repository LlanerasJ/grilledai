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
import { Button } from "@/app/ui/button";
import { HeaderChip, InterviewHeader } from "@/app/ui/interview-header";
import { Report } from "./report";

type Phase = "loading" | "interviewing" | "evaluating" | "done" | "error";

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Three bouncing dots while the interviewer is "typing".
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-600"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

function InterviewerAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-sm shadow-sm">
      🔥
    </span>
  );
}

export default function InterviewPage() {
  const router = useRouter();
  const [setup, setSetup] = useState<InterviewSetup | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice input + delivery analytics (Phase 2).
  const sr = useSpeechRecognition();
  const [deliveries, setDeliveries] = useState<AnswerDelivery[]>([]);
  const baseRef = useRef(""); // textarea text captured when the mic started
  const voiceStartRef = useRef<number | null>(null);

  const questionCount = turns.filter((t) => t.speaker === "interviewer").length;

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

  // Session timer while the interview is live.
  useEffect(() => {
    if (phase !== "interviewing" && phase !== "loading") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, phase, busy]);

  // Keep the textarea height hugging its content (up to a cap).
  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }
  useEffect(autoGrow, [input]);

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
        body: JSON.stringify({
          setup: s,
          transcript,
          mode: "text",
          delivery: deliveries.length ? aggregate(deliveries) : null,
        }),
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
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push("/")}>
          Start over
        </Button>
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
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-black">
      <InterviewHeader
        title={setup?.role ?? "Mock interview"}
        subtitle={setup ? `${setup.type} interview` : undefined}
      >
        <HeaderChip>
          Q{Math.max(questionCount, 1)} · {formatElapsed(elapsed)}
        </HeaderChip>
        <Button
          variant="secondary"
          size="sm"
          onClick={endInterview}
          disabled={busy || turns.length === 0}
        >
          End &amp; get feedback
        </Button>
      </InterviewHeader>

      {/* conversation */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
          {turns.map((t, i) =>
            t.speaker === "interviewer" ? (
              <div key={i} className="flex items-start gap-3">
                <InterviewerAvatar />
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-4 py-3 text-sm leading-relaxed shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  {t.content}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-orange-600 px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                  {t.content}
                </div>
              </div>
            ),
          )}

          {(busy || phase === "loading") && (
            <div className="flex items-start gap-3">
              <InterviewerAvatar />
              <div className="rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* composer */}
      {phase === "interviewing" && (
        <div className="border-t border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/70">
          <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
            <div
              className={`flex items-end gap-2 rounded-2xl border bg-white p-2 shadow-sm transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 dark:bg-zinc-950 ${
                sr.listening
                  ? "border-red-400 ring-2 ring-red-500/20"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {sr.supported && (
                <button
                  onClick={toggleMic}
                  title={sr.listening ? "Stop recording" : "Answer with your voice"}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition ${
                    sr.listening
                      ? "animate-pulse bg-red-500 text-white"
                      : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  {sr.listening ? "■" : "🎤"}
                </button>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submitAnswer();
                  }
                }}
                rows={1}
                placeholder={
                  sr.listening ? "Listening… speak your answer" : "Type or speak your answer…"
                }
                className="max-h-40 flex-1 resize-none self-center bg-transparent px-1 py-2 text-sm leading-relaxed outline-none placeholder:text-zinc-400"
              />
              <button
                onClick={submitAnswer}
                disabled={busy || !input.trim()}
                title="Send (Enter)"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-zinc-400">
              Enter to send · Shift+Enter for a new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
