"use client";
import { DEMO_RESULTS } from "@/lib/results-types";
import { ResultsView } from "@/components/results-view";

export default function DemoResultsPage() {
  return <ResultsView data={DEMO_RESULTS} />;
}
