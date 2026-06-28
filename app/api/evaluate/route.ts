import { NextRequest, NextResponse } from "next/server";
import { generateJson, MODELS } from "@/lib/llm";
import { evaluatorSystemPrompt, renderTranscript } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import type { DeliveryStats, EvaluationReport, InterviewSetup, Turn } from "@/lib/types";

export const runtime = "nodejs";

// Cold, honest evaluation of the full transcript — the product's moat.
// Also persists the completed interview for the signed-in user (Phase 3b).
export async function POST(req: NextRequest) {
  try {
    const { setup, transcript, mode, delivery } = (await req.json()) as {
      setup: InterviewSetup;
      transcript: Turn[];
      mode?: "text" | "avatar";
      delivery?: DeliveryStats | null;
    };

    const report = await generateJson<EvaluationReport>({
      model: MODELS.evaluator,
      system: evaluatorSystemPrompt(setup),
      prompt: `Evaluate this interview transcript:\n\n${renderTranscript(transcript)}`,
    });

    // Save the interview. A save failure must not break the user's report, so
    // it's best-effort and isolated.
    let id: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("interviews")
          .insert({
            user_id: user.id,
            mode: mode ?? "text",
            role: setup?.role,
            interview_type: setup?.type,
            jd: setup?.jd,
            resume: setup?.resume,
            transcript,
            report,
            delivery: delivery ?? null,
            readiness_score: report.overall.readinessScore,
          })
          .select("id")
          .single();
        id = data?.id ?? null;
      }
    } catch (saveErr) {
      console.error("Failed to save interview:", saveErr);
    }

    return NextResponse.json({ report, id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
