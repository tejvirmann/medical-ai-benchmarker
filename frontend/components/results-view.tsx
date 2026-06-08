"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, ReferenceLine,
  Area, AreaChart,
} from "recharts";
import type { ResultsData, ModelResult } from "@/lib/results-types";

// ── Constants ─────────────────────────────────────────────────────────────────

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const MODEL_COLORS = ["#4f46e5", "#0891b2", "#059669"];

// ── Simulated drift history (12 months) ──────────────────────────────────────
// Shows what ongoing monitoring would surface post-deployment.

function makeDriftHistory(baseAuc: number, drifts: boolean) {
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  return months.map((m, i) => {
    let auc = baseAuc;
    if (drifts && i >= 7) {
      // Scanner upgrade event in January causes drift
      auc = baseAuc - (i - 6) * 0.012;
    }
    // Add small noise
    auc += (Math.sin(i * 1.7) * 0.003);
    return { month: m, auc: parseFloat(auc.toFixed(3)) };
  });
}

const DRIFT_HISTORIES: Record<string, ReturnType<typeof makeDriftHistory>> = {
  chexnet: makeDriftHistory(0.933, true),
  biovil: makeDriftHistory(0.974, false),
  vendor_x: makeDriftHistory(0.955, false),
};

// ── Simulated agent observability data ───────────────────────────────────────
// Represents what token spend and latency look like for Problem 6: agent benchmarking.

const AGENT_RUNS = [
  { run: "Run 1", tokens_in: 1240, tokens_out: 380, latency_s: 4.2, steps: 5, task: "Triage: Chest CT", status: "complete", hallucination: false },
  { run: "Run 2", tokens_in: 2100, tokens_out: 610, latency_s: 7.8, steps: 8, task: "Triage: Chest CT", status: "complete", hallucination: false },
  { run: "Run 3", tokens_in: 890,  tokens_out: 210, latency_s: 3.1, steps: 4, task: "Triage: Chest CT", status: "complete", hallucination: true  },
  { run: "Run 4", tokens_in: 1560, tokens_out: 490, latency_s: 5.5, steps: 6, task: "Triage: Chest CT", status: "complete", hallucination: false },
  { run: "Run 5", tokens_in: 3200, tokens_out: 820, latency_s: 11.2, steps: 12, task: "Triage: Chest CT", status: "complete", hallucination: false },
  { run: "Run 6", tokens_in: 1100, tokens_out: 290, latency_s: 3.8, steps: 4, task: "Triage: Chest CT", status: "complete", hallucination: false },
];

const AGENT_MODELS = [
  { name: "GPT-4o", task_completion: 0.94, reasoning_fidelity: 0.89, safety_score: 0.97, avg_tokens: 1680, avg_latency_s: 5.1, cost_per_run: 0.058 },
  { name: "Claude Sonnet", task_completion: 0.96, reasoning_fidelity: 0.93, safety_score: 0.99, avg_tokens: 1420, avg_latency_s: 4.3, cost_per_run: 0.042 },
  { name: "Gemini 1.5 Pro", task_completion: 0.91, reasoning_fidelity: 0.86, safety_score: 0.95, avg_tokens: 1910, avg_latency_s: 6.2, cost_per_run: 0.031 },
];

const TOKEN_SPEND_HISTORY = [
  { week: "W1", cost: 12.40, runs: 48 },
  { week: "W2", cost: 18.90, runs: 71 },
  { week: "W3", cost: 15.20, runs: 59 },
  { week: "W4", cost: 24.60, runs: 94 },
  { week: "W5", cost: 31.10, runs: 118 },
  { week: "W6", cost: 28.40, runs: 109 },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function SubgroupChart({ model }: { model: ModelResult }) {
  const byDim = (dim: string) =>
    model.subgroups
      .filter((s) => s.group_name === dim)
      .map((s) => ({ name: s.group_value, AUC: s.auc }));

  const dims = [
    { key: "sex", label: "Sex" },
    { key: "age_group", label: "Age Group" },
    { key: "scanner", label: "Scanner" },
  ];

  return (
    <div className="space-y-6 mt-4">
      {dims.map(({ key, label }) => {
        const data = byDim(key);
        if (!data.length) return null;
        return (
          <div key={key}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{label}</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis domain={[0.7, 1.0]} tickFormatter={(v) => v.toFixed(2)} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(3) : v)} labelFormatter={(l) => `${label}: ${l}`} />
                <Bar dataKey="AUC" radius={[3, 3, 0, 0]}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={model.auc - entry.AUC > 0.05 ? "#ef4444" : "#4f46e5"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-1">Red = AUC gap &gt;5% vs. overall</p>
          </div>
        );
      })}
    </div>
  );
}

function DriftTab({ results }: { results: ModelResult[] }) {
  return (
    <div className="space-y-6">
      {/* Explainer */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        <span className="font-medium">What is model drift?</span>{" "}
        After deployment, real-world performance degrades silently. Scanners get upgraded. Patient
        populations shift. Disease prevalence changes. MedBench re-runs your benchmark monthly and
        alerts when AUC drops below threshold. The chart below simulates 12 months of post-deployment
        monitoring — note the drop in CheXNet&apos;s performance after a scanner upgrade in January.
      </div>

      {/* Per-model drift charts */}
      {results.map((r) => {
        const history = DRIFT_HISTORIES[r.model_id] ?? DRIFT_HISTORIES.biovil;
        const latest = history[history.length - 1].auc;
        const initial = history[0].auc;
        const dropped = initial - latest > 0.02;

        return (
          <Card key={r.model_id} className="border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-semibold text-slate-900 text-sm">{r.model_name}</span>
                  <span className="ml-2 text-xs text-slate-400">{r.model_source}</span>
                </div>
                {dropped ? (
                  <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs">
                    ⚠ Drift detected — {((initial - latest) * 100).toFixed(1)}% AUC drop
                  </Badge>
                ) : (
                  <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
                    ✓ Stable
                  </Badge>
                )}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={history} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis domain={[0.80, 1.0]} tickFormatter={(v) => v.toFixed(2)} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(3) : v)} />
                  <ReferenceLine y={r.auc - 0.05} stroke="#ef4444" strokeDasharray="4 2" label={{ value: "Alert threshold", position: "right", fontSize: 9, fill: "#ef4444" }} />
                  <Line type="monotone" dataKey="auc" stroke={dropped ? "#ef4444" : "#4f46e5"} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              {dropped && (
                <p className="text-xs text-red-600 mt-2">
                  Scanner upgrade event detected in January. Model re-validation recommended before continued use.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* How drift happens */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-slate-900 mb-3">How drift happens in practice</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { type: "Data drift", desc: "Scanner hardware upgraded — pixel distribution shifts. Model trained on old scanner patterns underperforms.", icon: "🖥" },
              { type: "Population drift", desc: "Patient demographics change. New referral patterns or a new hospital campus with different population mix.", icon: "👥" },
              { type: "Concept drift", desc: "Disease presentation evolves. A new variant has subtly different imaging features from training data.", icon: "🔬" },
            ].map((d) => (
              <div key={d.type} className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="text-xl mb-1">{d.icon}</div>
                <div className="text-xs font-semibold text-slate-700 mb-1">{d.type}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{d.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ObservabilityTab() {
  const totalCost = TOKEN_SPEND_HISTORY.reduce((s, w) => s + w.cost, 0);
  const totalRuns = TOKEN_SPEND_HISTORY.reduce((s, w) => s + w.runs, 0);
  const hallucinations = AGENT_RUNS.filter((r) => r.hallucination).length;

  return (
    <div className="space-y-6">
      {/* Explainer */}
      <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-800">
        <span className="font-medium">Agent Observability (Problem 6).</span>{" "}
        When AI agents perform clinical reasoning — triage, multi-step diagnosis, report generation —
        benchmarking changes. You need to track token spend, latency per reasoning step, tool call
        accuracy, and whether the agent hallucinated findings. This section shows what that looks like.
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total agent cost (6 wks)", value: `$${totalCost.toFixed(2)}`, sub: `${totalRuns} runs` },
          { label: "Cost per run (avg)", value: `$${(totalCost / totalRuns).toFixed(3)}`, sub: "across all models" },
          { label: "Hallucination rate", value: `${((hallucinations / AGENT_RUNS.length) * 100).toFixed(0)}%`, sub: `${hallucinations} of ${AGENT_RUNS.length} runs`, alert: hallucinations > 0 },
          { label: "Avg latency", value: `${(AGENT_RUNS.reduce((s, r) => s + r.latency_s, 0) / AGENT_RUNS.length).toFixed(1)}s`, sub: "per agent decision" },
        ].map((k) => (
          <Card key={k.label} className={`border shadow-sm ${k.alert ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold mb-0.5 ${k.alert ? "text-red-700" : "text-slate-900"}`}>{k.value}</div>
              <div className="text-xs font-medium text-slate-600">{k.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Token spend over time */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-slate-900 mb-4">Weekly Token Spend</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={TOKEN_SPEND_HISTORY} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip formatter={(v) => (typeof v === "number" ? `$${v.toFixed(2)}` : v)} />
              <Area type="monotone" dataKey="cost" stroke="#4f46e5" fill="#eef2ff" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Agent model comparison */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="px-5 pt-5 pb-3">
            <p className="text-sm font-semibold text-slate-900">Agent Model Benchmark</p>
            <p className="text-xs text-slate-500 mt-0.5">Comparing LLM agents on clinical triage tasks — same evaluation framework as model benchmarking, extended for agentic behavior</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50">
                  {["Agent", "Task Completion", "Reasoning Fidelity", "Safety Score", "Avg Tokens", "Latency", "Cost/Run"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {AGENT_MODELS.map((m) => (
                  <tr key={m.name} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                    <td className="px-4 py-3 text-slate-600">{pct(m.task_completion)}</td>
                    <td className="px-4 py-3 text-slate-600">{pct(m.reasoning_fidelity)}</td>
                    <td className="px-4 py-3">
                      <Badge className={m.safety_score >= 0.98 ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}>
                        {pct(m.safety_score)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{m.avg_tokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500">{m.avg_latency_s}s</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">${m.cost_per_run.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Run log */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-slate-900 mb-4">Agent Run Log</p>
          <div className="space-y-2">
            {AGENT_RUNS.map((r) => (
              <div key={r.run} className={`flex items-center justify-between rounded-lg px-4 py-3 text-xs border ${r.hallucination ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-700">{r.run}</span>
                  <span className="text-slate-500">{r.task}</span>
                  <span className="text-slate-400">{r.steps} steps</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500">{r.tokens_in + r.tokens_out} tokens</span>
                  <span className="text-slate-500">{r.latency_s}s</span>
                  {r.hallucination ? (
                    <Badge className="bg-red-100 text-red-700 border border-red-200">⚠ Hallucination</Badge>
                  ) : (
                    <Badge className="bg-green-50 text-green-700 border border-green-200">✓ Clean</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export function ResultsView({ data }: { data: ResultsData }) {
  const aucChartData = data.results.map((r) => ({ name: r.model_name, AUC: r.auc }));

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-500 hover:text-slate-700 text-sm">← MedBench</Link>
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
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Plain-language Summary</p>
            <p className="text-sm text-slate-700 leading-relaxed">{data.summary}</p>
          </CardContent>
        </Card>

        {/* Main tabs */}
        <Tabs defaultValue="benchmark">
          <TabsList className="mb-6">
            <TabsTrigger value="benchmark">Benchmark Results</TabsTrigger>
            <TabsTrigger value="drift">Drift Monitoring</TabsTrigger>
            <TabsTrigger value="observability">Agent Observability</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Benchmark ── */}
          <TabsContent value="benchmark" className="space-y-6">
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
                            {["Model", "AUC", "Sens", "Spec", "Latency", "Bias"].map((h) => (
                              <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.results.map((r) => (
                            <tr key={r.model_id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="font-medium text-slate-900">{r.model_name}</div>
                                <div className="text-xs text-slate-400">{r.model_source}</div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="font-mono font-semibold text-slate-800">{r.auc.toFixed(3)}</span>
                              </td>
                              <td className="px-4 py-3.5 text-slate-600">{pct(r.sensitivity)}</td>
                              <td className="px-4 py-3.5 text-slate-600">{pct(r.specificity)}</td>
                              <td className="px-4 py-3.5 text-slate-500 text-xs">{r.latency_ms}ms</td>
                              <td className="px-4 py-3.5">
                                {r.bias_flagged ? (
                                  <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs whitespace-nowrap">
                                    ⚠ {r.bias_description}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">✓ Equitable</Badge>
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

              {/* AUC chart */}
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

            {/* Subgroup detail */}
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
          </TabsContent>

          {/* ── Tab 2: Drift ── */}
          <TabsContent value="drift">
            <DriftTab results={data.results} />
          </TabsContent>

          {/* ── Tab 3: Observability ── */}
          <TabsContent value="observability">
            <ObservabilityTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
