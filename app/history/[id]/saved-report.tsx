"use client";

import { useRouter } from "next/navigation";
import type { DeliveryStats, EvaluationReport } from "@/lib/types";
import { Report } from "../../interview/report";

// Renders a previously saved report, with "back to history" instead of restart.
export function SavedReport({
  report,
  delivery,
}: {
  report: EvaluationReport;
  delivery: DeliveryStats | null;
}) {
  const router = useRouter();
  return <Report report={report} delivery={delivery} onRestart={() => router.push("/history")} />;
}
