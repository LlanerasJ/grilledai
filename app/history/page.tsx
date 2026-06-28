import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Trend } from "./trend";

export const runtime = "nodejs";

interface Row {
  id: string;
  created_at: string;
  role: string | null;
  mode: string;
  interview_type: string | null;
  readiness_score: number | null;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 55) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("interviews")
    .select("id, created_at, role, mode, interview_type, readiness_score")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Row[];
  // Oldest -> newest for the trend line.
  const scores = [...rows]
    .reverse()
    .map((r) => r.readiness_score)
    .filter((s): s is number => typeof s === "number");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Your history</h1>
        <Link
          href="/"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          New interview
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-zinc-500">
          No interviews yet. Complete one and it&apos;ll show up here with your score.
        </p>
      ) : (
        <>
          <section className="mt-8 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <Trend scores={scores} />
          </section>

          <ul className="mt-6 space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/history/${r.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.role ?? "Interview"}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" · "}
                      {r.interview_type ?? "—"}
                      {" · "}
                      <span className="capitalize">{r.mode}</span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-2xl font-bold ${
                      r.readiness_score != null ? scoreColor(r.readiness_score) : "text-zinc-400"
                    }`}
                  >
                    {r.readiness_score ?? "—"}
                    <span className="text-sm text-zinc-400">/100</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
