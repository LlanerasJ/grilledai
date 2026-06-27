import { NextRequest, NextResponse } from "next/server";
import { endConversation } from "@/lib/tavus";

export const runtime = "nodejs";

// Ends a live Tavus conversation by id (frees the call / stops minutes).
export async function POST(req: NextRequest) {
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: "Missing conversation id" }, { status: 400 });
    await endConversation(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
