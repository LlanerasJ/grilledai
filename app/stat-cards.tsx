"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  count: number;
  avg: number | null;
  last: number | null;
}

function scoreColor(v: number | null): string {
  if (v == null) return "text-zinc-400";
  if (v >= 80) return "text-green-600 dark:text-green-400";
  if (v >= 55) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function Card({
  label,
  value,
  color = "",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export function StatCards() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("interviews")
      .select("readiness_score, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = data ?? [];
        const scores = rows
          .map((r) => r.readiness_score as number | null)
          .filter((s): s is number => typeof s === "number");
        setStats({
          count: rows.length,
          avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
          last: scores[0] ?? null,
        });
      });
  }, []);

  const count = stats?.count ?? 0;
  const avg = stats?.avg ?? null;
  const last = stats?.last ?? null;

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card label="Interviews" value={String(count)} />
      <Card label="Avg readiness" value={avg != null ? `${avg}` : "—"} color={scoreColor(avg)} />
      <Card label="Last score" value={last != null ? `${last}` : "—"} color={scoreColor(last)} />
    </div>
  );
}
