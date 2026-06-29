"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InterviewSetup, InterviewType } from "@/lib/types";
import { TEMPLATES, type RoleTemplate } from "@/lib/templates";
import { StatCards } from "@/app/stat-cards";

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
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  function applyTemplate(t: RoleTemplate) {
    setRole(t.role);
    setType(t.type);
    setJd(t.jd);
    setResume(t.resume);
    setActiveTemplate(t.id);
  }

  function saveSetup() {
    const setup: InterviewSetup = { role, type, jd, resume };
    sessionStorage.setItem("interviewSetup", JSON.stringify(setup));
  }

  function start() {
    saveSetup();
    router.push("/interview");
  }

  function startAvatar() {
    saveSetup();
    router.push("/avatar");
  }

  const ready = role.trim() && jd.trim() && resume.trim();
  const inputCls =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-orange-500";

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 md:px-10 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New interview</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Set up your session, then start. You&apos;ll get honest, scored feedback at the end.
        </p>
      </div>

      <StatCards />

      {/* setup card */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <label className="block text-sm font-semibold">Quick start with a template</label>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TEMPLATES.map((t) => {
              const active = activeTemplate === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 dark:bg-orange-950/20"
                      : "border-zinc-200 hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-600"
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-lg dark:bg-orange-950/30">
                    {t.emoji}
                  </span>
                  <span className="text-sm font-medium leading-tight">{t.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            Prefills the fields below — edit anything, or fill it in yourself.
          </p>
        </div>

        <hr className="my-7 border-zinc-200 dark:border-zinc-800" />

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold">Role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`mt-1.5 ${inputCls}`}
              placeholder="e.g. Senior Backend Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Interview type</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    type === t.value
                      ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                      : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold">Job description</label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={4}
              className={`mt-1.5 resize-none ${inputCls}`}
              placeholder="Paste the job description..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Your resume</label>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              rows={4}
              className={`mt-1.5 resize-none ${inputCls}`}
              placeholder="Paste your resume (text)..."
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={start}
              disabled={!ready}
              className="flex h-12 flex-1 items-center justify-center rounded-lg bg-orange-600 font-medium text-white shadow-sm transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start text interview
            </button>
            <button
              onClick={startAvatar}
              disabled={!ready}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 font-medium transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:border-zinc-500"
            >
              🎥 Avatar interview
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">
                Beta
              </span>
            </button>
          </div>
          {!ready && (
            <p className="text-center text-xs text-zinc-400">
              Fill in role, job description, and resume to begin.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
