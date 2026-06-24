// Provider-agnostic LLM wrapper. Today: Google Gemini (free tier).
// To swap to Claude later, only this file changes — callers use chat()/generateJson().

import { GoogleGenAI } from "@google/genai";

// Models are centralized so they're easy to tune/swap.
export const MODELS = {
  interviewer: "gemini-2.5-flash", // fast + cheap for live turns
  evaluator: "gemini-2.5-flash", // free-tier friendly; upgrade to -pro or Claude later
} as const;

function client(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local (see README).");
  }
  return new GoogleGenAI({ apiKey });
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

// A conversational turn: returns the model's next text reply.
export async function chat(opts: {
  model: string;
  system: string;
  messages: ChatMessage[];
  temperature?: number;
}): Promise<string> {
  const res = await client().models.generateContent({
    model: opts.model,
    contents: opts.messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: opts.system,
      temperature: opts.temperature ?? 0.7,
    },
  });
  return res.text ?? "";
}

// A single JSON-mode generation (used by the evaluator). Returns parsed T.
export async function generateJson<T>(opts: {
  model: string;
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<T> {
  const res = await client().models.generateContent({
    model: opts.model,
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    config: {
      systemInstruction: opts.system,
      temperature: opts.temperature ?? 0.3,
      responseMimeType: "application/json",
    },
  });
  const text = res.text ?? "";
  try {
    return JSON.parse(text) as T;
  } catch {
    // Best-effort: strip code fences if the model added them despite JSON mode.
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned) as T;
  }
}
