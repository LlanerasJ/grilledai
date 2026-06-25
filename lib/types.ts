// Shared types for the interview + evaluation flow.

export type InterviewType = "behavioral" | "technical" | "screening" | "case";

export interface InterviewSetup {
  jd: string;
  resume: string;
  type: InterviewType;
  role: string; // e.g. "Senior Backend Engineer"
}

export type Speaker = "interviewer" | "candidate";

export interface Turn {
  speaker: Speaker;
  content: string;
}

// ---- Evaluation report (mirrors docs/evaluator-design.md section 4) ----

export interface DimensionScore {
  score: number; // 1-5
  evidence: string; // exact candidate quote
}

export interface QuestionEvaluation {
  question: string;
  scores: {
    relevance: DimensionScore;
    structure: DimensionScore;
    specificity: DimensionScore;
    depth: DimensionScore;
    impact: DimensionScore;
    communication: DimensionScore;
  };
  biggestWeakness: string;
  rewrite: string;
  flags: string[];
}

export interface EvaluationReport {
  perQuestion: QuestionEvaluation[];
  overall: {
    readinessScore: number; // 0-100
    verdict: string;
    topStrengths: string[];
    topFixes: string[];
  };
}

// ---- Delivery analytics (Phase 2 — computed client-side from voice input) ----

// Metrics for a single spoken answer.
export interface AnswerDelivery {
  words: number;
  durationSec: number;
  wordsPerMinute: number;
  fillerCount: number;
  fillerBreakdown: Record<string, number>;
}

// Aggregate across all spoken answers in an interview.
export interface DeliveryStats {
  spokenAnswers: number;
  totalWords: number;
  totalDurationSec: number;
  wordsPerMinute: number;
  fillerCount: number;
  fillerPer100Words: number;
  fillerBreakdown: Record<string, number>;
}
