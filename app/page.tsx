"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InterviewSetup, InterviewType } from "@/lib/types";

const TYPES: { value: InterviewType; label: string }[] = [
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "screening", label: "Screening" },
  { value: "case", label: "Case" },
];

export default function SetupPage() {
  const router = useRouter();
  const [role, setRole] = useState("Senior Backend Engineer");
  const [type, setType] = useState<InterviewType>("behavioral");
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");

  function start() {
    const setup: InterviewSetup = { role, type, jd, resume };
    sessionStorage.setItem("interviewSetup", JSON.stringify(setup));
    router.push("/interview");
  }

  const ready = role.trim() && jd.trim() && resume.trim();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">GrilledAI</h1>
      <p className="mt-2 text-zinc-500">
        Practice with an AI interviewer, then get honest, specific feedback.
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium">Role</label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
            placeholder="e.g. Senior Backend Engineer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Interview type</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  type === t.value
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Job description</label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
            placeholder="Paste the job description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Your resume</label>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
            placeholder="Paste your resume (text)..."
          />
        </div>

        <button
          onClick={start}
          disabled={!ready}
          className="w-full rounded-lg bg-zinc-900 py-3 font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Start interview
        </button>
      </div>
    </main>
  );
}
