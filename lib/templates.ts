// One-click role presets for the setup screen. Each prefills the role, interview
// type, a realistic job description, and a short starter resume the user can edit.

import type { InterviewType } from "./types";

export interface RoleTemplate {
  id: string;
  label: string;
  emoji: string;
  role: string;
  type: InterviewType;
  jd: string;
  resume: string;
}

export const TEMPLATES: RoleTemplate[] = [
  {
    id: "swe",
    label: "Software Engineer",
    emoji: "💻",
    role: "Senior Backend Engineer",
    type: "behavioral",
    jd: `Senior Backend Engineer on a high-traffic payments platform. You'll own services end to end, design for reliability and scale, and mentor mid-level engineers. We value ownership, clear communication of trade-offs, and a track record of measurable impact. Stack: Go, Postgres, Kafka, AWS.`,
    resume: `5 years backend experience. Currently a Software Engineer at a fintech working on the transactions service (Go, Postgres). Previously full-stack at an early-stage startup. Highlights: led migration of a monolith to services; improved API performance; on-call for a payments system.`,
  },
  {
    id: "pm",
    label: "Product Manager",
    emoji: "📊",
    role: "Senior Product Manager",
    type: "behavioral",
    jd: `Senior Product Manager owning a core B2B SaaS product area. You'll set strategy, prioritize a roadmap against business goals, and partner with engineering and design. We value structured thinking, crisp prioritization with clear trade-offs, and outcomes measured in metrics, not features shipped.`,
    resume: `6 years in product. Currently PM at a B2B SaaS company owning the onboarding and activation area. Previously an analyst. Highlights: drove a 20% lift in activation; led a pricing experiment; shipped a self-serve flow across 3 teams.`,
  },
  {
    id: "nurse",
    label: "Registered Nurse",
    emoji: "🏥",
    role: "Registered Nurse (Med-Surg)",
    type: "behavioral",
    jd: `Registered Nurse for a busy medical-surgical unit. You'll deliver patient care, coordinate with physicians and families, and handle high-pressure situations with empathy and precision. We value patient safety, clear communication, teamwork under stress, and sound clinical judgment.`,
    resume: `BSN with 3 years on a med-surg floor at a regional hospital. Experience with post-op care, patient education, and EHR charting. Highlights: precepted new grads; recognized for patient-satisfaction scores; handled rapid-response situations.`,
  },
  {
    id: "ae",
    label: "Account Executive",
    emoji: "🤝",
    role: "Account Executive (SaaS Sales)",
    type: "behavioral",
    jd: `Account Executive selling a mid-market SaaS product. You'll run the full sales cycle from discovery to close, manage a pipeline, and hit quarterly quota. We value consultative selling, resilience, clear qualification, and a metrics-driven approach to the funnel.`,
    resume: `4 years in SaaS sales. Currently AE at a mid-market software company, average deal size ~$40k. Previously SDR. Highlights: 115% of quota last year; built a referral motion; shortened average sales cycle by 12 days.`,
  },
];
