import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DeliveryStats, EvaluationReport } from "@/lib/types";
import { SavedReport } from "./saved-report";

export const runtime = "nodejs";

// Next 16: route params are async and must be awaited.
export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  // RLS ensures the user can only read their own interview.
  const { data } = await supabase
    .from("interviews")
    .select("report, delivery")
    .eq("id", id)
    .single();

  if (!data?.report) notFound();

  return (
    <SavedReport
      report={data.report as EvaluationReport}
      delivery={(data.delivery as DeliveryStats | null) ?? null}
    />
  );
}
