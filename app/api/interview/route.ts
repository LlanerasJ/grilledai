import { NextRequest, NextResponse } from "next/server";
import { chat, MODELS, type ChatMessage } from "@/lib/llm";
import { interviewerSystemPrompt, COMPLETE_TOKEN } from "@/lib/prompts";
import type { InterviewSetup, Turn } from "@/lib/types";

export const runtime = "nodejs";

// Drives the live interview. Send the setup + transcript so far; get the
// interviewer's next message back. `done` is true when the interview is over.
export async function POST(req: NextRequest) {
  try {
    const { setup, history } = (await req.json()) as {
      setup: InterviewSetup;
      history: Turn[];
    };

    // Map our transcript to the model's user/model roles. The interviewer is the
    // "model"; the candidate is the "user".
    const messages: ChatMessage[] = history.map((t) => ({
      role: t.speaker === "interviewer" ? "model" : "user",
      content: t.content,
    }));

    // On the very first call (no history) nudge the model to open the interview.
    if (messages.length === 0) {
      messages.push({ role: "user", content: "Please begin the interview." });
    }

    const raw = await chat({
      model: MODELS.interviewer,
      system: interviewerSystemPrompt(setup),
      messages,
    });

    const done = raw.includes(COMPLETE_TOKEN);
    const message = raw.replace(COMPLETE_TOKEN, "").trim();

    return NextResponse.json({ message, done });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
