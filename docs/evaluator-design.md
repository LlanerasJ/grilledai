# Evaluator Design — the honest-feedback engine

> This is the core differentiator of the product. Competitors lose because their
> feedback is **sycophantic** ("Great answer! 9/10") or **empty** ("7/10", no
> reason). This document specifies a rubric and an evaluator prompt engineered to
> do the opposite: honest, calibrated, evidence-cited, and specific enough to act on.
>
> Model: Gemini free tier for the proof. Provider is swappable; Claude (Opus) is the
> eventual quality target for production, since non-sycophantic critique is exactly
> where it's strongest.

---

## 1. Design principles

1. **Evidence over verdict.** Every judgment must quote the candidate's actual
   words. No score without a reason; no reason without a quote.
2. **Calibrated, not kind.** The grader is told that most real answers are mediocre.
   A "5" is rare and must be earned. Grade inflation is treated as a failure mode.
3. **Specific and rewritable.** Feedback names the exact missing thing (a metric, an
   assumption, a trade-off) and shows a concrete improved version — not "be more
   detailed."
4. **Catch what others miss.** Explicitly hunt for: vague trade-offs, unstated
   assumptions, missing quantified results, dodged questions, rambling/time
   management, and ownership ("we" hiding the candidate's actual role).
5. **Separate from the interviewer.** The live interviewer persona is encouraging
   and in-character. The evaluator is a *different* call with a cold, analytical
   stance. They never share a prompt — that separation is what keeps feedback honest.

---

## 2. The rubric

Each answer is scored on 6 dimensions, 1–5, with explicit anchors. Behavioral
interviews weight Structure/STAR heavily; technical interviews reweight toward
Depth/Reasoning (weights configurable per interview type).

| # | Dimension | What it measures |
|---|-----------|------------------|
| 1 | **Relevance** | Did they answer the *actual* question, or an adjacent one they'd rather answer? |
| 2 | **Structure** | Is it organized (STAR for behavioral; problem→approach→trade-offs→result for technical) or a wandering pile of facts? |
| 3 | **Specificity** | Concrete details, names, numbers, real examples — vs. generic platitudes that could come from anyone. |
| 4 | **Depth & Reasoning** | Trade-offs weighed, assumptions surfaced, "why" not just "what". The thing that separates senior from junior. |
| 5 | **Impact & Ownership** | Quantified results, and a clear account of what *the candidate personally* did (not the team). |
| 6 | **Communication** | Concise, clear, low filler, well-paced. (Delivery stats — filler words/pacing — feed this once voice input exists.) |

### Scoring anchors (the anti-inflation calibration)

The same anchors apply to every dimension:

- **5 — Exceptional.** Rare. Would impress a tough interviewer. Nothing material to add.
- **4 — Strong.** Clearly above the bar, one minor gap.
- **3 — Adequate.** Answers the question but unremarkable; a real interviewer would
  have follow-up doubts. **This is the default/expected score for a typical answer.**
- **2 — Weak.** Notable gaps: vague, unstructured, or partly off-target.
- **1 — Poor.** Doesn't answer, badly off-target, or no substance.

> **Calibration instruction baked into the prompt:** "Assume the median answer is a
> 3. Most candidates are not exceptional. Reserve 5 for answers you genuinely could
> not improve. If you find yourself giving mostly 4s and 5s, you are being too
> generous — recalibrate."

---

## 3. The evaluator prompt (draft)

This is the system prompt for the post-interview evaluation call. The full transcript
+ the job context (resume + JD) + interview type are provided as input.

```
You are a rigorous, experienced interview coach evaluating a candidate's mock
interview. Your job is to give feedback that is HONEST and SPECIFIC enough to
actually change how they perform — not feedback that makes them feel good.

You are NOT the interviewer. You are a cold, analytical evaluator reviewing a
transcript after the fact. Do not be encouraging for its own sake.

## Context
- Job description: {jd}
- Candidate resume: {resume}
- Interview type: {type}  (behavioral | technical | screening | case)

## How to grade
Score every answer on six dimensions, 1–5, using these anchors:
  5 Exceptional (rare) · 4 Strong · 3 Adequate (the DEFAULT) · 2 Weak · 1 Poor

Assume the median answer is a 3. Most candidates are not exceptional. A 5 must be
an answer you genuinely could not improve. If most of your scores are 4–5, you are
inflating — recalibrate downward.

## Hard rules
1. NEVER give a score without quoting the candidate's exact words as evidence.
2. For every answer, name at least one concrete, specific weakness — even strong
   answers have one. "No notable weakness" is not allowed below a 5.
3. Banned phrases: "great job", "excellent answer", "you did well", "good job",
   and any praise that isn't immediately backed by a specific quote.
4. When you criticize, show the FIX: a rewritten phrase or a concrete example of
   what a stronger answer would have included.
5. Actively hunt for these common failures and call them out by name when present:
   - Dodged the question / answered an easier adjacent one
   - Vague trade-offs ("it depends") with no actual trade-off named
   - Unstated assumptions that should have been surfaced
   - No quantified result / impact
   - "We" hiding what the candidate personally did
   - Rambling, no structure, or poor time management

## Output
Return JSON matching the schema in section 4. For each question: per-dimension
scores with a one-line evidence quote each, the single biggest weakness, and one
concrete rewrite. Then an overall readiness verdict.
```

---

## 4. Output schema

```json
{
  "perQuestion": [
    {
      "question": "string — the question asked",
      "scores": {
        "relevance":     { "score": 1, "evidence": "exact candidate quote" },
        "structure":     { "score": 1, "evidence": "exact candidate quote" },
        "specificity":   { "score": 1, "evidence": "exact candidate quote" },
        "depth":         { "score": 1, "evidence": "exact candidate quote" },
        "impact":        { "score": 1, "evidence": "exact candidate quote" },
        "communication": { "score": 1, "evidence": "exact candidate quote" }
      },
      "biggestWeakness": "the single most important thing to fix, named specifically",
      "rewrite": "a concrete improved version of a key part of their answer",
      "flags": ["dodged_question", "no_quantified_result", "..."]
    }
  ],
  "overall": {
    "readinessScore": 0,            // 0–100, calibrated (see note)
    "verdict": "one honest paragraph — would they pass this round? why/why not",
    "topStrengths": ["specific, evidence-backed"],
    "topFixes": ["the 3 highest-leverage changes, in priority order"]
  }
}
```

> **Readiness calibration:** map the dimension scores to 0–100 but anchor it: an
> all-3 interview ("adequate") should land around 55–60 — a real "maybe", not a pass.
> 80+ means genuinely ready. This keeps the headline number honest too.

---

## 5. How we'll prove it works (the $0 test)

1. Write 2–3 realistic sample transcripts of varying quality (one weak, one mixed,
   one strong) for a chosen role.
2. Run each through this evaluator prompt on the Gemini free tier.
3. Paste the *same* transcript into plain ChatGPT/Gemini chat with a naive "give me
   feedback" prompt.
4. Compare side by side. The win condition: our output names specific weaknesses with
   quotes and rewrites that the naive version misses or softens.

If our output is visibly sharper, the concept is proven — for free, with no app yet.

---

## 6. Open questions to resolve before coding

- **Interview type weighting** — exact dimension weights for behavioral vs technical
  vs case. (Draft: behavioral weights Structure+Impact; technical weights Depth.)
- **Role templates** — which roles ship first (SWE, PM, nursing, sales…?).
- **Per-answer vs whole-interview** — do we also score cross-answer consistency and
  whether they improved as the interview went on?
- **Rewrite length** — how long should the example rewrites be before they stop being
  useful and start writing the answer *for* them?
```
