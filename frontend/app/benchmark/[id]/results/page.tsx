"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, ReferenceLine,
} from "recharts";
import { DEMO_RESULTS, type ResultsData, type ModelResult } from "@/lib/results-types";
import { ResultsView } from "@/components/results-view";

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ResultsData | null>(id === "demo" ? DEMO_RESULTS : null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id === "demo") return;
    fetch(`http://localhost:8000/benchmark/${id}/results`)
      .then((r) => {
        if (r.status === 202) throw new Error("still_running");
        if (!r.ok) throw new Error("not_found");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error === "still_running")
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 mb-3">Benchmark still running…</p>
          <Link href={`/benchmark/${id}`}>
            <Button variant="outline">← Back to progress</Button>
          </Link>
        </div>
      </main>
    );

  if (!data)
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">Loading results…</p>
      </main>
    );

  return <ResultsView data={data} />;
}
