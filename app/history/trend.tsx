// Simple inline SVG sparkline of readiness scores over time (oldest -> newest).
// Pure presentational — safe to render on the server.

export function Trend({ scores }: { scores: number[] }) {
  if (scores.length < 2) {
    return (
      <p className="text-sm text-zinc-400">
        Complete a couple more interviews to see your readiness trend.
      </p>
    );
  }

  const W = 600;
  const H = 140;
  const pad = 24;
  const max = 100;
  const min = 0;
  const stepX = (W - pad * 2) / (scores.length - 1);

  const x = (i: number) => pad + i * stepX;
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);

  const points = scores.map((s, i) => `${x(i)},${y(s)}`).join(" ");
  const first = scores[0];
  const last = scores[scores.length - 1];
  const delta = last - first;

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-sm text-zinc-500">Readiness trend</span>
        <span
          className={`text-sm font-semibold ${
            delta > 0
              ? "text-green-600 dark:text-green-400"
              : delta < 0
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-500"
          }`}
        >
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {Math.abs(delta)} pts
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Readiness over time">
        {/* gridlines at 50 and 80 (the "maybe" and "ready" marks) */}
        {[50, 80].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={W - pad}
            y1={y(g)}
            y2={y(g)}
            stroke="currentColor"
            strokeWidth="1"
            className="text-zinc-200 dark:text-zinc-800"
          />
        ))}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-zinc-900 dark:text-zinc-100"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {scores.map((s, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(s)}
            r="3.5"
            className="fill-zinc-900 dark:fill-zinc-100"
          />
        ))}
      </svg>
    </div>
  );
}
