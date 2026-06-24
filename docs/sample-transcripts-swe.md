# Sample Transcripts — Software Engineer (test fixtures)

> These are the test material for proving the evaluator (see `evaluator-design.md`).
> Three transcripts of deliberately different quality for the **same role and
> questions**, so the evaluator's scores should clearly separate them. If the
> evaluator scores all three similarly, the rubric is broken.
>
> Interview type: **behavioral + light technical** · Level: **mid/senior SWE**

---

## Shared context (fed to the evaluator as JD + resume)

**Job description (excerpt):**
> Senior Backend Engineer. You'll own services in a high-traffic payments platform,
> design for reliability and scale, and mentor mid-level engineers. We value
> ownership, clear communication of trade-offs, and a track record of measurable
> impact. Stack: Go, Postgres, Kafka, AWS.

**Candidate resume (excerpt):**
> 5 years backend experience. Current: Software Engineer at a fintech, working on
> the transactions service (Go, Postgres). Previously full-stack at a startup.
> "Led migration of monolith to services." "Improved API performance."

**Questions asked (same for all three candidates):**
1. Tell me about a technically challenging project you owned end to end.
2. Describe a time a system you built failed in production. What happened and what did you do?
3. Tell me about a disagreement with a teammate over a technical decision.

---

## Transcript A — WEAK (target: mostly 2s, some 1s)

**Q1 — Tell me about a technically challenging project you owned end to end.**

> Yeah so we had this big project where we needed to move our monolith to
> microservices because it was getting really hard to maintain. It was a pretty big
> deal and everyone was involved. We used a bunch of different technologies and it
> took a while but eventually we got it done. It was challenging because there were a
> lot of moving parts and we had to coordinate across teams. I learned a lot about
> distributed systems from it. It was definitely one of the harder things I've worked
> on but I think we did a good job in the end.

**Q2 — Describe a time a system you built failed in production.**

> Hmm, there was this one time where things went down. I think it was a database
> issue or maybe a deployment thing, it was a while ago. We got paged and the team
> jumped on it and we figured it out eventually. It was stressful but we handled it.
> After that we made sure to be more careful. These things happen sometimes in
> production, you just have to deal with them when they come up.

**Q3 — Tell me about a disagreement with a teammate over a technical decision.**

> Yeah I mean disagreements happen. There was a guy on my team who wanted to do
> something a different way than me. We talked about it and eventually we kind of met
> in the middle. I'm pretty easygoing so I don't really like conflict, I think it's
> better to just find a compromise and move on. It worked out fine in the end.

---

## Transcript B — MIXED (target: spread of 2s and 3s, one 4)

**Q1 — Tell me about a technically challenging project you owned end to end.**

> I led the migration of our transactions service off the monolith. The hard part
> was that it handled live payments, so we couldn't have downtime. I designed a
> strangler-pattern approach where we routed a small percentage of traffic to the new
> service first and ramped it up. We used a feature flag to control the rollout. It
> took about four months. The main challenge was data consistency between the old and
> new systems during the transition — we ended up dual-writing for a period. It went
> pretty smoothly overall and the new service was easier to work with.

**Q2 — Describe a time a system you built failed in production.**

> We had an incident where the transactions service started timing out under load.
> It turned out a query I'd written was doing a full table scan because it was missing
> an index — it was fine in staging but the production table was way bigger. I got
> paged, looked at the slow query logs, found it, and added the index. It was
> resolved in maybe 30 minutes. After that I was more careful about checking query
> plans before shipping.

**Q3 — Tell me about a disagreement with a teammate over a technical decision.**

> A teammate wanted to use Kafka for a feature where I thought a simple Postgres
> queue would be enough. I thought Kafka was overkill and added operational
> complexity. We went back and forth. Eventually I looked at the actual throughput
> requirements and they were low, so I made that case and we went with Postgres. I
> think being able to point to the real numbers helped. It worked out and we shipped
> faster.

---

## Transcript C — STRONG (target: mostly 4s, some 5s)

**Q1 — Tell me about a technically challenging project you owned end to end.**

> I owned the migration of our transactions service out of the monolith. Context:
> the monolith was processing about 2,000 payments/second at peak and deploys were
> taking 40 minutes, which meant incident recovery was slow. I proposed and led the
> extraction.
>
> The core challenge was zero-downtime on a system handling live money. I used a
> strangler pattern: stood up the new Go service, dual-wrote to both old and new
> Postgres stores, and reconciled nightly to catch drift. I ramped traffic with a
> feature flag from 1% to 100% over two weeks, watching error rates and p99 latency
> at each step. The trade-off I weighed was dual-write complexity vs. a hard
> cutover — I chose dual-write because a hard cutover risked dropping payments, which
> was unacceptable. The reconciliation job caught 14 edge-case mismatches we'd have
> otherwise shipped as silent data corruption.
>
> Result: deploy time dropped from 40 minutes to under 5, and we cut p99 latency on
> the payment path by 35%. Two mid-level engineers worked under me; I designed the
> rollout and reviewed all of it.

**Q2 — Describe a time a system you built failed in production.**

> About a month after that migration, the new service started returning 500s during
> a traffic spike. I was on call. From the dashboards I saw connection-pool
> exhaustion on Postgres — the new service was opening far more connections than the
> monolith had, and we hit the max. Short term, I bumped the pool limit and added a
> pgbouncer in front to stop the bleeding within about 15 minutes. But that was a
> band-aid, so the real fix was adding connection pooling limits per instance and an
> alert on pool saturation so we'd catch it before users did. The root cause was that
> I'd load-tested throughput but not connection count — I added connection metrics to
> our standard load-test checklist after that, and we haven't had a repeat.

**Q3 — Tell me about a disagreement with a teammate over a technical decision.**

> A senior teammate wanted to introduce Kafka for an event feature. I pushed back —
> not because Kafka is bad, but because our throughput was under 50 events/second and
> we had no other Kafka in the stack, so it meant a new operational surface, on-call
> burden, and infra cost for a problem a Postgres-backed outbox table could solve.
> Rather than argue abstractly, I wrote a one-page comparison with the actual numbers
> and the on-call cost, and proposed we revisit Kafka if throughput crossed a
> threshold. He pushed back that Postgres-as-a-queue doesn't scale, which is true at
> high volume, so we agreed on the threshold as the trigger. We shipped on Postgres in
> a week; 18 months later it still hasn't crossed the threshold. The lesson I took is
> that disagreements move faster when you argue with numbers, not opinions.

---

## Expected evaluator behavior (our success criteria)

The evaluator passes the test if it:

- **Separates the three clearly** — A averages ~2, B ~3, C ~4+. If they bunch up, the rubric isn't discriminating.
- **Catches A's specifics:** "we" everywhere with no personal ownership, zero metrics,
  "I think we did a good job" with no evidence, dodges Q2 ("maybe a database issue").
- **Credits B fairly but honestly:** good structure and a real metric (30 min), but
  thin on quantified impact and light on the trade-off reasoning — should land at 3,
  not inflated to 4–5.
- **Recognizes C's depth:** named trade-offs (dual-write vs cutover, Kafka threshold),
  quantified results (40→5 min, 35% p99, 14 mismatches), clear "I vs we" ownership,
  and a real root-cause/prevention loop in Q2 — without rounding everything to 5.
- **Still finds a weakness in C** (the hard rule). E.g., Q3's outcome leans on "it
  hasn't crossed the threshold," which is partly luck, not validated judgment.
