"use client";

import type { DimensionScore, EvaluationReport } from "@/lib/types";

const DIMENSIONS: { key: keyof QuestionScores; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "structure", label: "Structure" },
  { key: "specificity", label: "Specificity" },
  { key: "depth", label: "Depth" },
  { key: "impact", label: "Impact" },
  { key: "communication", label: "Communication" },
];

type QuestionScores = EvaluationReport["perQuestion"][number]["scores"];

function scoreColor(score: number): string {
  if (score >= 4) return "text-green-600 dark:text-green-400";
  if (score === 3) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function readinessColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 55) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function Dimension({ label, ds }: { label: string; ds: DimensionScore }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        <span className={`text-sm font-bold ${scoreColor(ds.score)}`}>{ds.score}/5</span>
      </div>
      <p className="mt-1 text-xs italic text-zinc-500">&ldquo;{ds.evidence}&rdquo;</p>
    </div>
  );
}

export function Report({
  report,
  onRestart,
}: {
  report: EvaluationReport;
  onRestart: () => void;
}) {
  const { overall, perQuestion } = report;
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Your feedback</h1>

      {/* Overall */}
      <section className="mt-6 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="flex items-baseline gap-3">
          <span className="text-sm text-zinc-500">Readiness</span>
          <span className={`text-4xl font-bold ${readinessColor(overall.readinessScore)}`}>
            {overall.readinessScore}
            <span className="text-lg text-zinc-400">/100</span>
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {overall.verdict}
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Top strengths</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
              {overall.topStrengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Highest-leverage fixes</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
              {overall.topFixes.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Per question */}
      <h2 className="mt-10 text-xl font-semibold">Question by question</h2>
      <div className="mt-4 space-y-6">
        {perQuestion.map((q, i) => (
          <section key={i} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <p className="font-medium">
              {i + 1}. {q.question}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DIMENSIONS.map((d) => (
                <Dimension key={d.key} label={d.label} ds={q.scores[d.key]} />
              ))}
            </div>

            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm dark:bg-red-950/30">
              <span className="font-semibold text-red-700 dark:text-red-400">
                Biggest weakness:{" "}
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">{q.biggestWeakness}</span>
            </div>

            <div className="mt-2 rounded-lg bg-green-50 p-3 text-sm dark:bg-green-950/30">
              <span className="font-semibold text-green-700 dark:text-green-400">
                Stronger version:{" "}
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">{q.rewrite}</span>
            </div>

            {q.flags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {q.flags.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="mt-10 rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        New interview
      </button>
    </main>
  );
}
