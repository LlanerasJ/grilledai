// Deterministic delivery analytics computed from spoken-answer transcripts.
// Done client-side (no LLM) so filler counts and pacing are exact and free.

import type { AnswerDelivery, DeliveryStats } from "./types";

// Single-word and multi-word filler phrases we flag. Order matters: multi-word
// phrases are matched first so "you know" isn't double-counted as "you" + "know".
const FILLERS = [
  "you know",
  "i mean",
  "kind of",
  "sort of",
  "um",
  "uh",
  "erm",
  "hmm",
  "like",
  "actually",
  "basically",
  "literally",
  "honestly",
];

function countWords(text: string): number {
  const m = text.trim().match(/\b[\w']+\b/g);
  return m ? m.length : 0;
}

// Analyze one spoken answer given its text and how long it took to say.
export function analyzeAnswer(text: string, durationSec: number): AnswerDelivery {
  const lower = ` ${text.toLowerCase()} `;
  const breakdown: Record<string, number> = {};
  let fillerCount = 0;

  for (const filler of FILLERS) {
    // Word-boundary, global, case-insensitive count of this filler.
    const re = new RegExp(`\\b${filler.replace(/ /g, "\\s+")}\\b`, "g");
    const matches = lower.match(re);
    if (matches && matches.length > 0) {
      breakdown[filler] = matches.length;
      fillerCount += matches.length;
    }
  }

  const words = countWords(text);
  const wpm = durationSec > 0 ? Math.round((words / durationSec) * 60) : 0;

  return {
    words,
    durationSec: Math.round(durationSec),
    wordsPerMinute: wpm,
    fillerCount,
    fillerBreakdown: breakdown,
  };
}

// Roll per-answer metrics up into one interview-level summary.
export function aggregate(answers: AnswerDelivery[]): DeliveryStats {
  const totalWords = answers.reduce((s, a) => s + a.words, 0);
  const totalDurationSec = answers.reduce((s, a) => s + a.durationSec, 0);
  const fillerCount = answers.reduce((s, a) => s + a.fillerCount, 0);

  const fillerBreakdown: Record<string, number> = {};
  for (const a of answers) {
    for (const [k, v] of Object.entries(a.fillerBreakdown)) {
      fillerBreakdown[k] = (fillerBreakdown[k] ?? 0) + v;
    }
  }

  return {
    spokenAnswers: answers.length,
    totalWords,
    totalDurationSec,
    wordsPerMinute:
      totalDurationSec > 0 ? Math.round((totalWords / totalDurationSec) * 60) : 0,
    fillerCount,
    fillerPer100Words:
      totalWords > 0 ? Math.round((fillerCount / totalWords) * 1000) / 10 : 0,
    fillerBreakdown,
  };
}

// Plain-English read on pacing, used in the report.
export function pacingLabel(wpm: number): { label: string; tone: "good" | "warn" } {
  if (wpm === 0) return { label: "—", tone: "good" };
  if (wpm < 110) return { label: "a bit slow", tone: "warn" };
  if (wpm > 170) return { label: "a bit fast", tone: "warn" };
  return { label: "good pace", tone: "good" };
}
