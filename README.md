# GrilledAI

Practice interviews with an AI interviewer, then get **honest, specific, rubric-scored
feedback** — the opposite of "Great answer, 9/10!". Built feedback-first (see `docs/`).

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind
- Google Gemini (free tier) via `@google/genai` — provider-agnostic wrapper in
  `lib/llm.ts`, so swapping to Claude later is a one-file change.

## How it works
1. **Setup** (`/`) — enter the role, interview type, job description, and resume.
2. **Interview** (`/interview`) — a live text chat. The interviewer (one Gemini prompt)
   asks one grounded question at a time and probes weak answers.
3. **Feedback** — on "End", a *separate, cold* evaluator prompt scores every answer on
   6 dimensions, names the biggest weakness, and shows a stronger rewrite.

Two distinct LLM roles live in `lib/prompts.ts` — the encouraging interviewer and the
honest evaluator are deliberately separate. That separation is the moat.

## Run it locally
1. Get a free key at https://aistudio.google.com/apikey
2. Put it in `.env.local`:
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. Install + run:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:3000

## Project docs
- `docs/evaluator-design.md` — the rubric + evaluator prompt (the core asset)
- `docs/sample-transcripts-swe.md` — test fixtures (weak/mixed/strong)
- `docs/proof-runbook.md` — the $0 manual validation of the concept

## Roadmap
- [x] Phase 0 — prove the evaluator beats naive feedback (done, $0)
- [x] Phase 1 — web app: setup → text interview → report (this)
- [ ] Phase 2 — voice input (browser Web Speech API) + delivery stats
- [ ] Phase 3 — auth, DB, history, role templates
- [ ] Phase 4 — photorealistic avatar (Tavus), swapped in at the front
