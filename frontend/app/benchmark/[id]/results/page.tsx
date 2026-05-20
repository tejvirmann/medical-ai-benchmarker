"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

interface SubgroupResult {
  group_name: string;
  group_value: string;
  n: number;
  auc: number;
  sensitivity: number;
  specificity: number;
}

interface ModelResult {
  model_id: string;
  model_name: string;
  model_source: string;
  auc: number;
  sensitivity: number;
  specificity: number;
  bias_flagged: boolean;
  bias_description: string | null;
  subgroups: SubgroupResult[];
  latency_ms: number;
}

interface ResultsData {
  id: string;
  n_cases: number;
  summary: string;
  results: ModelResult[];
}

// ── Demo data (used when id === "demo") ──────────────────────────────────────

const DEMO_RESULTS: ResultsData = {
  id: "demo",
  n_cases: 500,
  summary:
    "BioViL-T achieves the highest AUC (0.97) among models with no detected subgroup bias — recommended for diverse patient populations. CheXNet is flagged for bias: 61+ age group (9% AUC gap vs. overall). Review subgroup performance before deployment in heterogeneous populations.",
  results: [
    {
      model_id: "chexnet",
      model_name: "CheXNet",
      model_source: "Stanford (open source)",
      auc: 0.933,
      sensitivity: 0.882,
      specificity: 0.851,
      bias_flagged: true,
      bias_description: "61+ age group (9% AUC gap vs. overall)",
      latency_ms: 42,
      subgroups: [
        { group_name: "sex", group_value: "male", n: 246, auc: 0.979, sensitivity: 0.91, specificity: 0.87 },
        { group_name: "sex", group_value: "female", n: 254, auc: 0.886, sensitivity: 0.84, specificity: 0.83 },
        { group_name: "age_group", group_value: "18-40", n: 130, auc: 0.993, sensitivity: 0.95, specificity: 0.91 },
        { group_name: "age_group", group_value: "41-60", n: 190, auc: 0.972, sensitivity: 0.90, specificity: 0.88 },
        { group_name: "age_group", group_value: "61+", n: 180, auc: 0.846, sensitivity: 0.75, specificity: 0.82 },
        { group_name: "scanner", group_value: "GE", n: 175, auc: 0.930, sensitivity: 0.88, specificity: 0.85 },
        { group_name: "scanner", group_value: "Siemens", n: 154, auc: 0.944, sensitivity: 0.90, specificity: 0.86 },
        { group_name: "scanner", group_value: "Philips", n: 171, auc: 0.930, sensitivity: 0.87, specificity: 0.84 },
      ],
    },
    {
      model_id: "biovil",
      model_name: "BioViL-T",
      model_source: "Microsoft Research",
      auc: 0.974,
      sensitivity: 0.928,
      specificity: 0.891,
      bias_flagged: false,
      bias_description: null,
      latency_ms: 67,
      subgroups: [
        { group_name: "sex", group_value: "male", n: 246, auc: 0.968, sensitivity: 0.92, specificity: 0.88 },
        { group_name: "sex", group_value: "female", n: 254, auc: 0.978, sensitivity: 0.93, specificity: 0.90 },
        { group_name: "age_group", group_value: "18-40", n: 130, auc: 0.975, sensitivity: 0.94, specificity: 0.90 },
        { group_name: "age_group", group_value: "41-60", n: 190, auc: 0.968, sensitivity: 0.92, specificity: 0.89 },
        { group_name: "age_group", group_value: "61+", n: 180, auc: 0.977, sensitivity: 0.93, specificity: 0.89 },
        { group_name: "scanner", group_value: "GE", n: 175, auc: 0.981, sensitivity: 0.94, specificity: 0.90 },
        { group_name: "scanner", group_value: "Siemens", n: 154, auc: 0.977, sensitivity: 0.93, specificity: 0.89 },
        { group_name: "scanner", group_value: "Philips", n: 171, auc: 0.965, sensitivity: 0.92, specificity: 0.88 },
      ],
    },
    {
      model_id: "vendor_x",
      model_name: "Vendor Model X",
      model_source: "Proprietary (FDA 510(k))",
      auc: 0.955,
      sensitivity: 0.862,
      specificity: 0.905,
      bias_flagged: false,
      bias_description: null,
      latency_ms: 28,
      subgroups: [
        { group_name: "sex", group_value: "male", n: 246, auc: 0.965, sensitivity: 0.87, specificity: 0.91 },
        { group_name: "sex", group_value: "female", n: 254, auc: 0.949, sensitivity: 0.86, specificity: 0.90 },
        { group_name: "age_group", group_value: "18-40", n: 130, auc: 0.962, sensitivity: 0.87, specificity: 0.92 },
        { group_name: "age_group", group_value: "41-60", n: 190, auc: 0.952, sensitivity: 0.86, specificity: 0.90 },
        { group_name: "age_group", group_value: "61+", n: 180, auc: 0.958, sensitivity: 0.86, specificity: 0.91 },
        { group_name: "scanner", group_value: "GE", n: 175, auc: 0.967, sensitivity: 0.87, specificity: 0.91 },
        { group_name: "scanner", group_value: "Siemens", n: 154, auc: 0.956, sensitivity: 0.86, specificity: 0.91 },
        { group_name: "scanner", group_value: "Philips", n: 171, auc: 0.944, sensitivity: 0.85, specificity: 0.90 },
      ],
    },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const MODEL_COLORS = ["#4f46e5", "#0891b2", "#059669"];

function SubgroupChart({ model }: { model: ModelResult }) {
  const byDimension = (dim: string) =>
    model.subgroups
      .filter((s) => s.group_name === dim)
      .map((s) => ({ name: s.group_value, AUC: s.auc, n: s.n }));

  const dims = ["sex", "age_group", "scanner"];
  const dimLabels: Record<string, string> = { sex: "Sex", age_group: "Age Group", scanner: "Scanner" };

  return (
    <div className="space-y-6 mt-4">
      {dims.map((dim) => {
        const data = byDimension(dim);
        if (!data.length) return null;
        return (
          <div key={dim}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              {dimLabels[dim]}
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis domain={[0.7, 1.0]} tickFormatter={(v) => v.toFixed(2)} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  formatter={(v) => (typeof v === "number" ? v.toFixed(3) : v)}
                  labelFormatter={(l) => `${dimLabels[dim]}: ${l}`}
                />
                <Bar dataKey="AUC" radius={[3, 3, 0, 0]}>
                  {data.map((entry, i) => {
                    const gap = model.auc - entry.AUC;
                    const color = gap > 0.05 ? "#ef4444" : "#4f46e5";
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-1">Red bars = AUC gap &gt;5% vs. overall (bias flag threshold)</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

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

  const aucChartData = data.results.map((r) => ({ name: r.model_name, AUC: r.auc }));

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-500 hover:text-slate-700 text-sm">
            ← MedBench
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-900">Results</span>
          <Badge variant="secondary" className="text-xs font-mono">{data.id}</Badge>
        </div>
        <a href={`http://localhost:8000/benchmark/${data.id}/report`} target="_blank" rel="noreferrer">
          <Button size="sm" variant="outline" className="border-slate-300 text-slate-700">
            Download PDF Report
          </Button>
        </a>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Benchmark Results</h1>
          <p className="text-sm text-slate-500">
            Pneumonia Detection · Chest X-Ray · Adult ICU · {data.n_cases} cases
          </p>
        </div>

        {/* Summary */}
        <Card className="border border-indigo-200 bg-indigo-50 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
              Plain-language Summary
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{data.summary}</p>
          </CardContent>
        </Card>

        {/* Comparison table + AUC chart */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Table */}
          <div className="lg:col-span-3">
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="px-5 pt-5 pb-3">
                  <h2 className="text-sm font-semibold text-slate-900">Model Comparison</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-slate-100 bg-slate-50">
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Model</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">AUC</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sens</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Spec</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Latency</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bias</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.results.map((r) => (
                        <tr key={r.model_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-slate-900">{r.model_name}</div>
                            <div className="text-xs text-slate-400">{r.model_source}</div>
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <span className="font-mono font-semibold text-slate-800">{r.auc.toFixed(3)}</span>
                          </td>
                          <td className="px-3 py-3.5 text-center text-slate-600">{pct(r.sensitivity)}</td>
                          <td className="px-3 py-3.5 text-center text-slate-600">{pct(r.specificity)}</td>
                          <td className="px-3 py-3.5 text-center text-slate-500 text-xs">{r.latency_ms}ms</td>
                          <td className="px-4 py-3.5">
                            {r.bias_flagged ? (
                              <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs whitespace-nowrap">
                                ⚠ {r.bias_description}
                              </Badge>
                            ) : (
                              <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
                                ✓ Equitable
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AUC bar chart */}
          <div className="lg:col-span-2">
            <Card className="border border-slate-200 shadow-sm h-full">
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">AUC Comparison</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={aucChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis domain={[0.8, 1.0]} tickFormatter={(v) => v.toFixed(2)} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(3) : v)} />
                    <Bar dataKey="AUC" radius={[4, 4, 0, 0]}>
                      {aucChartData.map((_, i) => (
                        <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1">
                  {data.results.map((r, i) => (
                    <div key={r.model_id} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                      {r.model_name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Subgroup detail tabs */}
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Subgroup Performance Detail</h2>
            <Tabs defaultValue={data.results[0]?.model_id}>
              <TabsList className="mb-4">
                {data.results.map((r) => (
                  <TabsTrigger key={r.model_id} value={r.model_id} className="text-sm">
                    {r.model_name}
                    {r.bias_flagged && <span className="ml-1.5 text-red-500">⚠</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
              {data.results.map((r) => (
                <TabsContent key={r.model_id} value={r.model_id}>
                  {r.bias_flagged && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      <span className="font-medium">Bias flag: </span>
                      {r.bias_description}. Performance in this subgroup falls more than 5% below the overall AUC.
                      Deployment in heterogeneous populations warrants additional validation.
                    </div>
                  )}
                  <SubgroupChart model={r} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <a href={`http://localhost:8000/benchmark/${data.id}/report`} target="_blank" rel="noreferrer">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Download Governance Report (PDF)
            </Button>
          </a>
          <Link href="/benchmark/new">
            <Button variant="outline" className="border-slate-300 text-slate-700">
              Run Another Benchmark
            </Button>
          </Link>
        </div>

        <p className="text-xs text-slate-400 max-w-2xl">
          DISCLAIMER: MedBench provides evaluation tools only. Results do not constitute clinical recommendations.
          Deployment decisions remain the responsibility of the institution&apos;s clinical governance committee.
        </p>
      </div>
    </main>
  );
}
