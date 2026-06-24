import { NextRequest, NextResponse } from "next/server";
import { generateJson, MODELS } from "@/lib/llm";
import { evaluatorSystemPrompt, renderTranscript } from "@/lib/prompts";
import type { EvaluationReport, InterviewSetup, Turn } from "@/lib/types";

export const runtime = "nodejs";

// Cold, honest evaluation of the full transcript — the product's moat.
export async function POST(req: NextRequest) {
  try {
    const { setup, transcript } = (await req.json()) as {
      setup: InterviewSetup;
      transcript: Turn[];
    };

    const report = await generateJson<EvaluationReport>({
      model: MODELS.evaluator,
      system: evaluatorSystemPrompt(setup),
      prompt: `Evaluate this interview transcript:\n\n${renderTranscript(transcript)}`,
    });

    return NextResponse.json({ report });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
