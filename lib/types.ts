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
