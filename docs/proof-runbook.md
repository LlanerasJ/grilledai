# $0 Proof Runbook — run the evaluator by hand in Google AI Studio

> Goal: prove our evaluator gives sharper feedback than a naive prompt — for free,
> no API key, no code. You'll paste blocks below into the AI Studio chat and compare.
>
> Time: ~20 minutes. Cost: $0.

---

## Step 1 — Open Google AI Studio (free, no card)

1. Go to **https://aistudio.google.com**
2. Sign in with any Google account.
3. Click **"Create Prompt"** / **"Chat"** (a blank chat box).
4. On the right, set the model to a current **Gemini** model (the default flagship is
   fine). Leave other settings as-is.

That's it — no API key needed to type into the chat. (We only generate a key in
Step 6, and only if you want to.)

---

## Step 2 — Run OUR evaluator on Transcript A (weak)

Paste this entire block as one message:

````
You are a rigorous, experienced interview coach evaluating a candidate's mock
interview. Your job is to give feedback that is HONEST and SPECIFIC enough to
actually change how they perform — not feedback that makes them feel good.

You are NOT the interviewer. You are a cold, analytical evaluator reviewing a
transcript after the fact. Do not be encouraging for its own sake.

## Context
- Job: Senior Backend Engineer on a high-traffic payments platform (Go, Postgres,
  Kafka, AWS). Values ownership, clear trade-offs, measurable impact.
- Candidate: 5 years backend, currently on a fintech transactions service.
- Interview type: behavioral + light technical

## How to grade
Score every answer on six dimensions, 1–5: Relevance, Structure, Specificity,
Depth & Reasoning, Impact & Ownership, Communication.
Anchors: 5 Exceptional (rare) · 4 Strong · 3 Adequate (the DEFAULT) · 2 Weak · 1 Poor.
Assume the median answer is a 3. Most candidates are not exceptional. A 5 must be an
answer you genuinely could not improve. If most of your scores are 4–5, you are
inflating — recalibrate downward.

## Hard rules
1. NEVER give a score without quoting the candidate's exact words as evidence.
2. For every answer, name at least one concrete, specific weakness.
3. Banned phrases: "great job", "excellent answer", "you did well" — and any praise
   not immediately backed by a specific quote.
4. When you criticize, show the FIX: a rewritten phrase or concrete example.
5. Actively hunt for and name when present: dodged question, vague trade-offs,
   unstated assumptions, no quantified result, "we" hiding the candidate's role,
   rambling / poor time management.

## Output
For each question: the six scores (each with a one-line evidence quote), the single
biggest weakness, and one concrete rewrite. Then an overall readiness score (0–100,
where an all-"adequate" interview is ~55–60, not a pass) and a one-paragraph honest
verdict.

## Transcript to evaluate
Q1 — Tell me about a technically challenging project you owned end to end.
A: Yeah so we had this big project where we needed to move our monolith to
microservices because it was getting really hard to maintain. It was a pretty big
deal and everyone was involved. We used a bunch of different technologies and it took
a while but eventually we got it done. It was challenging because there were a lot of
moving parts and we had to coordinate across teams. I learned a lot about distributed
systems from it. It was definitely one of the harder things I've worked on but I
think we did a good job in the end.

Q2 — Describe a time a system you built failed in production.
A: Hmm, there was this one time where things went down. I think it was a database
issue or maybe a deployment thing, it was a while ago. We got paged and the team
jumped on it and we figured it out eventually. It was stressful but we handled it.
After that we made sure to be more careful. These things happen sometimes in
production, you just have to deal with them when they come up.

Q3 — Tell me about a disagreement with a teammate over a technical decision.
A: Yeah I mean disagreements happen. There was a guy on my team who wanted to do
something a different way than me. We talked about it and eventually we kind of met in
the middle. I'm pretty easygoing so I don't really like conflict, I think it's better
to just find a compromise and move on. It worked out fine in the end.
````

**What to look for:** low scores (mostly 2s, a 1), and it should explicitly call out
"we" with no ownership, zero metrics, and the dodged Q2. Readiness score should be low
(~30–45).

---

## Step 3 — Run OUR evaluator on Transcript C (strong)

Start a **new chat** (so the previous answer doesn't bias it). Paste the same prompt
as Step 2, but replace the "## Transcript to evaluate" section with this:

````
## Transcript to evaluate
Q1 — Tell me about a technically challenging project you owned end to end.
A: I owned the migration of our transactions service out of the monolith. The monolith
was processing about 2,000 payments/second at peak and deploys took 40 minutes. I
proposed and led the extraction. The core challenge was zero-downtime on a system
handling live money. I used a strangler pattern: stood up the new Go service,
dual-wrote to both old and new Postgres stores, and reconciled nightly to catch drift.
I ramped traffic with a feature flag from 1% to 100% over two weeks, watching error
rates and p99 at each step. The trade-off was dual-write complexity vs a hard
cutover — I chose dual-write because a hard cutover risked dropping payments. The
reconciliation job caught 14 edge-case mismatches we'd otherwise have shipped as
silent data corruption. Result: deploy time dropped from 40 minutes to under 5, and
p99 latency on the payment path fell 35%. Two mid-level engineers worked under me; I
designed the rollout and reviewed all of it.

Q2 — Describe a time a system you built failed in production.
A: About a month after the migration, the new service started returning 500s during a
traffic spike. I was on call. From the dashboards I saw connection-pool exhaustion on
Postgres — the new service opened far more connections than the monolith. Short term I
bumped the pool limit and added pgbouncer to stop the bleeding within ~15 minutes. That
was a band-aid, so the real fix was per-instance pooling limits plus an alert on pool
saturation. Root cause: I'd load-tested throughput but not connection count — I added
connection metrics to our standard load-test checklist, and we haven't had a repeat.

Q3 — Tell me about a disagreement with a teammate over a technical decision.
A: A senior teammate wanted to introduce Kafka for an event feature. I pushed back —
not because Kafka is bad, but because our throughput was under 50 events/second with no
other Kafka in the stack, so it meant a new operational surface, on-call burden, and
cost for something a Postgres outbox table could solve. Rather than argue abstractly, I
wrote a one-page comparison with the actual numbers and on-call cost, and proposed we
revisit Kafka if throughput crossed a threshold. He noted Postgres-as-a-queue doesn't
scale at high volume, which is true, so we agreed on the threshold as the trigger. We
shipped on Postgres in a week; 18 months later it still hasn't crossed it.
````

**What to look for:** much higher scores (mostly 4s, some 5s) — proving it
**discriminates** between A and C. But per the hard rule it should STILL find a weakness
(e.g. Q3 leaning on "it hasn't crossed the threshold" = partly luck). If it gives
straight 5s with no criticism, our anti-inflation rule isn't holding.

---

## Step 4 — Run the NAIVE prompt (the competitor baseline)

New chat. Paste this weak prompt + Transcript A (copy the Q/A text from Step 2):

````
Here's my mock interview. Can you give me feedback on how I did?

[paste the Q1/Q2/Q3 answers from Transcript A here]
````

**What to look for:** this is what competitors / plain ChatGPT produce. It'll likely be
vague and encouraging ("good awareness of distributed systems!", "nice job staying
calm"), few/no quotes, no scores, no concrete rewrites.

---

## Step 5 — Compare (this IS the proof)

Put Step 2's output next to Step 4's output for the same weak transcript. Our version
wins if it:
- gives **specific, quoted** weaknesses the naive one misses or softens,
- **doesn't inflate** the weak answer,
- gives **actionable rewrites**, not vibes.

And Step 2 vs Step 3 proves it **discriminates** by quality.

If both hold → concept proven. Screenshot the comparison; that's your demo artifact.

---

## Step 6 (optional, later) — get an API key for automation

Only needed when we turn this into a script/app, not for the manual proof:
1. In AI Studio, click **"Get API key"** → **"Create API key"**.
2. Copy it somewhere safe. We'll put it in a `.env` file (never commit it).
3. Tell me when you have it and I'll scaffold the Phase 0 script.
````
