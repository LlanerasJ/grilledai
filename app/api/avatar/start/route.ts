import { NextRequest, NextResponse } from "next/server";
import { buildInterviewerContext, createConversation } from "@/lib/tavus";
import type { InterviewSetup } from "@/lib/types";

export const runtime = "nodejs";

// Starts a Tavus CVI conversation and returns the joinable video URL.
// Phase 4 spike: uses Tavus's built-in LLM, steered by our interviewer context.
export async function POST(req: NextRequest) {
  try {
    const { setup } = (await req.json()) as { setup?: InterviewSetup };

    const role = setup?.role || "Senior Backend Engineer";
    const context =
      setup?.jd && setup?.resume
        ? buildInterviewerContext(role, setup.jd, setup.resume)
        : buildInterviewerContext(
            role,
            "General software engineering role.",
            "Experienced software engineer.",
          );

    const conversation = await createConversation({
      conversationName: `GrilledAI — ${role}`,
      conversationalContext: context,
      customGreeting: `Hi, thanks for joining. I'll be your interviewer today for the ${role} role. Ready when you are — let's begin.`,
      maxCallDurationSec: 300, // protect the free 25 minutes
    });

    return NextResponse.json({ url: conversation.conversation_url, id: conversation.conversation_id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
