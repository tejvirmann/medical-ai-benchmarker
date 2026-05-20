"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const MODEL_LABELS: Record<string, string> = {
  chexnet: "CheXNet (Stanford)",
  biovil: "BioViL-T (Microsoft Research)",
  vendor_x: "Vendor Model X",
};

const STATUS_MESSAGES = [
  "Loading model weights...",
  "Preprocessing DICOM inputs...",
  "Running inference on cases...",
  "Computing AUC and metrics...",
  "Slicing by subgroups...",
  "Detecting bias gaps...",
  "Finalizing results...",
];

export default function BenchmarkProgressPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [progress, setProgress] = useState(0);
  const [progressByModel, setProgressByModel] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("pending");
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2200);
    return () => clearInterval(msgTimer);
  }, []);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/benchmark/${id}`);
        const data = await res.json();
        setProgress(data.progress);
        setProgressByModel(data.progress_by_model || {});
        setStatus(data.status);
        if (data.status === "complete") {
          clearInterval(poll);
          router.push(`/benchmark/${id}/results`);
        }
      } catch {
        // backend may not be up yet — keep polling
      }
    }, 1000);
    return () => clearInterval(poll);
  }, [id, router]);

  const models = Object.keys(progressByModel);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-sm font-medium text-slate-600">Benchmark running</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Evaluating models</h1>
          <p className="text-sm text-slate-500">
            Pneumonia Detection · Chest X-Ray · 500 cases
          </p>
        </div>

        <Card className="border border-slate-200 shadow-sm mb-4">
          <CardContent className="p-6 space-y-5">
            {/* Overall */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">Overall progress</span>
                <span className="text-slate-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Per-model */}
            {models.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {models.map((m) => (
                  <div key={m}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-600">{MODEL_LABELS[m] ?? m}</span>
                      <span className="text-slate-400">{progressByModel[m]}%</span>
                    </div>
                    <Progress value={progressByModel[m]} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}

            {/* Status message */}
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-500 text-center">
              {STATUS_MESSAGES[msgIdx]}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          This takes about 30 seconds with demo data. In production, data never leaves your institution.
        </p>
      </div>
    </main>
  );
}
