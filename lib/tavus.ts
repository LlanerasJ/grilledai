// Tavus CVI (Conversational Video Interface) integration — Phase 4 avatar spike.
//
// Request fields confirmed against the live API (2026-06-27): create-conversation
// uses `replica_id` / `persona_id` and returns a `conversation_url` (a Daily room).

const TAVUS_BASE = "https://tavusapi.com/v2";

export interface CreateConversationInput {
  // Optional context to steer the built-in LLM for the spike.
  conversationName?: string;
  conversationalContext?: string;
  customGreeting?: string;
  // Protect the free 25 minutes — hard cap each call (seconds).
  maxCallDurationSec?: number;
}

export interface TavusConversation {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

export async function createConversation(
  input: CreateConversationInput,
): Promise<TavusConversation> {
  const apiKey = process.env.TAVUS_API_KEY;
  const replicaId = process.env.TAVUS_REPLICA_ID;
  const personaId = process.env.TAVUS_PERSONA_ID;

  if (!apiKey) throw new Error("TAVUS_API_KEY is not set in .env.local");
  if (!replicaId || !personaId) {
    throw new Error("TAVUS_REPLICA_ID and TAVUS_PERSONA_ID must be set in .env.local");
  }

  // --- The one place to adjust field names if the API differs ---
  const body = {
    replica_id: replicaId,
    persona_id: personaId,
    conversation_name: input.conversationName ?? "GrilledAI mock interview",
    conversational_context: input.conversationalContext,
    custom_greeting: input.customGreeting,
    properties: {
      max_call_duration: input.maxCallDurationSec ?? 300, // 5 min safety cap
      enable_closed_captions: true,
    },
  };

  const res = await fetch(`${TAVUS_BASE}/conversations`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Tavus create conversation failed (${res.status}): ${detail}`);
  }

  return (await res.json()) as TavusConversation;
}

// Build the interviewer context for the built-in LLM (spike). When we later move to
// our own LLM endpoint, this is replaced by routing Tavus to /api/interview.
export function buildInterviewerContext(role: string, jd: string, resume: string): string {
  return `You are an experienced, professional ${role} interviewer conducting a live mock interview.
Ask ONE question at a time, grounded in the job description and resume below. Probe weak or
vague answers with a natural follow-up. Cover about 4-5 topics, then thank the candidate and
wrap up.

After each answer, react briefly and naturally — one short sentence — before your next
question, so the conversation feels like a real back-and-forth. Acknowledge what they said
and, when warranted, drop a quick light note ("nice, that's a concrete example" or "got it —
I'd have loved a metric there"). Keep it conversational and to one sentence; do NOT give
formal scores or a detailed critique during the interview — the full rubric feedback comes
afterward.

JOB DESCRIPTION:
${jd}

CANDIDATE RESUME:
${resume}`;
}
