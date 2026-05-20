"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MODALITIES = [
  { id: "chest_xray", label: "Chest X-Ray", available: true },
  { id: "ct", label: "CT", available: false },
  { id: "mri", label: "MRI", available: false },
  { id: "pathology", label: "Pathology", available: false },
];

const TASKS = [
  { id: "pneumonia_detection", label: "Pneumonia Detection", available: true },
  { id: "nodule_detection", label: "Nodule Detection", available: false },
  { id: "fracture_detection", label: "Fracture Detection", available: false },
];

const POPULATIONS = [
  { id: "adult_icu", label: "Adult ICU", available: true },
  { id: "general_adult", label: "General Adult", available: false },
  { id: "pediatric", label: "Pediatric", available: false },
];

const MODELS = [
  {
    id: "chexnet",
    name: "CheXNet",
    source: "Stanford (open source)",
    description: "CNN trained on 100k+ chest X-rays. High overall AUC but known demographic variation.",
    tag: "Open Source",
  },
  {
    id: "biovil",
    name: "BioViL-T",
    source: "Microsoft Research (open source)",
    description: "Vision-language foundation model. Multimodal — integrates radiology reports.",
    tag: "Foundation Model",
  },
  {
    id: "vendor_x",
    name: "Vendor Model X",
    source: "Proprietary (demo)",
    description: "FDA 510(k)-cleared. Conservative detection profile — optimized for high specificity.",
    tag: "FDA Cleared",
  },
];

export default function NewBenchmarkPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [modality, setModality] = useState("chest_xray");
  const [task, setTask] = useState("pneumonia_detection");
  const [population, setPopulation] = useState("adult_icu");
  const [selectedModels, setSelectedModels] = useState<Record<string, boolean>>({
    chexnet: true,
    biovil: true,
    vendor_x: true,
  });
  const [loading, setLoading] = useState(false);

  function toggleModel(id: string) {
    setSelectedModels((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleRun() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modality,
          task,
          population,
          models: selectedModels,
          use_demo_data: true,
        }),
      });
      const data = await res.json();
      router.push(`/benchmark/${data.id}`);
    } catch {
      alert("Could not connect to backend. Make sure the backend is running on port 8000.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3 max-w-6xl mx-auto">
        <Link href="/" className="text-slate-500 hover:text-slate-700 text-sm">
          ← MedBench
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-900">New Benchmark</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                  step >= s
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`h-px w-10 ${step > s ? "bg-indigo-400" : "bg-slate-200"}`} />}
            </div>
          ))}
          <span className="ml-3 text-sm text-slate-500">
            {step === 1 && "What are you evaluating?"}
            {step === 2 && "Select models"}
            {step === 3 && "Review & run"}
          </span>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Modality</label>
                <div className="grid grid-cols-2 gap-2">
                  {MODALITIES.map((m) => (
                    <button
                      key={m.id}
                      disabled={!m.available}
                      onClick={() => m.available && setModality(m.id)}
                      className={`px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors
                        ${modality === m.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-700 hover:border-slate-300"}
                        ${!m.available ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {m.label}
                      {!m.available && <span className="ml-1 text-xs text-slate-400">(soon)</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Clinical Task</label>
                <div className="space-y-2">
                  {TASKS.map((t) => (
                    <button
                      key={t.id}
                      disabled={!t.available}
                      onClick={() => t.available && setTask(t.id)}
                      className={`w-full px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors
                        ${task === t.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-700 hover:border-slate-300"}
                        ${!t.available ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {t.label}
                      {!t.available && <span className="ml-1 text-xs text-slate-400">(soon)</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Patient Population</label>
                <div className="grid grid-cols-3 gap-2">
                  {POPULATIONS.map((p) => (
                    <button
                      key={p.id}
                      disabled={!p.available}
                      onClick={() => p.available && setPopulation(p.id)}
                      className={`px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors
                        ${population === p.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-700 hover:border-slate-300"}
                        ${!p.available ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {p.label}
                      {!p.available && <div className="text-xs text-slate-400 mt-0.5">soon</div>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
                <span className="font-medium">Data: </span>
                CheXpert demo dataset (500 cases, Stanford) — de-identified, public domain.{" "}
                <span className="text-slate-400">Upload your own data in a future version.</span>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Next: Select Models →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-slate-500">
                Select the models you want to compare. All will be evaluated on the same dataset
                with the same preprocessing pipeline.
              </p>
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleModel(m.id)}
                  className={`w-full px-4 py-4 rounded-xl border text-left transition-colors ${
                    selectedModels[m.id]
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 text-sm">{m.name}</span>
                        <Badge variant="secondary" className="text-xs">{m.tag}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mb-1">{m.source}</div>
                      <div className="text-xs text-slate-600">{m.description}</div>
                    </div>
                    <div
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                        selectedModels[m.id]
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {selectedModels[m.id] && "✓"}
                    </div>
                  </div>
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-slate-300">
                  ← Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!Object.values(selectedModels).some(Boolean)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Review & Run →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-base font-semibold text-slate-900">Review your benchmark</h2>

              <div className="rounded-lg bg-slate-50 border border-slate-200 divide-y divide-slate-200">
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-500">Modality</span>
                  <span className="font-medium text-slate-800">Chest X-Ray</span>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-500">Task</span>
                  <span className="font-medium text-slate-800">Pneumonia Detection</span>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-500">Population</span>
                  <span className="font-medium text-slate-800">Adult ICU</span>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-500">Dataset</span>
                  <span className="font-medium text-slate-800">CheXpert demo (500 cases)</span>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-slate-500">Models</span>
                  <span className="font-medium text-slate-800">
                    {MODELS.filter((m) => selectedModels[m.id])
                      .map((m) => m.name)
                      .join(", ")}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-700">
                <span className="font-medium">Data privacy: </span>
                In production, the MedBench Agent runs inside your firewall. Only aggregate
                metrics leave the institution — no patient data is transmitted.
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-slate-300">
                  ← Back
                </Button>
                <Button
                  onClick={handleRun}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading ? "Starting..." : "Run Benchmark →"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
