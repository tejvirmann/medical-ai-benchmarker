"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: "⚖️",
    title: "Neutral Evaluation",
    description:
      "Your data, your population. Every model runs through the same preprocessing pipeline — no vendor can cherry-pick the test set.",
  },
  {
    icon: "🔍",
    title: "Bias Detection",
    description:
      "Automatically slices performance by age, sex, and scanner type. Surfaces subgroup gaps before they become clinical incidents.",
  },
  {
    icon: "📈",
    title: "Drift Monitoring",
    description:
      "Re-benchmarks monthly. Alerts when a model's performance drops on your population so you catch it before radiologists notice.",
  },
];

const steps = [
  { n: "1", label: "Define your clinical task" },
  { n: "2", label: "Select models to compare" },
  { n: "3", label: "Run — data never leaves your institution" },
  { n: "4", label: "Get a governance-ready report" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-200 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900 tracking-tight">MedBench</span>
          <Badge variant="secondary" className="text-xs">POC v0.1</Badge>
        </div>
        <Link href="/benchmark/new">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Run a Benchmark →
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge className="mb-5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-50">
          Inspired by NeuralBench · Built for Clinical AI
        </Badge>
        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-5 tracking-tight">
          Benchmark clinical AI.<br />
          <span className="text-indigo-600">In minutes, not months.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          Hospitals sign $500k AI contracts based on vendor slide decks. MedBench lets you
          evaluate any model on your own patient population — neutral, standardized, and
          governable — without an engineering team.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/benchmark/new">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
              Run a Benchmark →
            </Button>
          </Link>
          <Link href="/benchmark/demo/results">
            <Button size="lg" variant="outline" className="px-8 border-slate-300 text-slate-700">
              View Sample Report
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 border-y border-slate-200 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8 text-center">
            How it works
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {s.n}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <span className="hidden sm:block text-slate-300 text-lg px-1">›</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <Card key={i} className="border border-slate-200 shadow-sm rounded-xl">
              <CardContent className="pt-6 pb-7 px-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="bg-slate-900 py-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-xs uppercase font-semibold tracking-widest mb-4">The Problem</p>
          <blockquote className="text-white text-2xl font-light leading-relaxed mb-4">
            &ldquo;There are still systems today that are not equipped with the right workflow and
            adequate support structures to deploy AI algorithms effectively.&rdquo;
          </blockquote>
          <p className="text-slate-400 text-sm">
            Dr. Dania Daye, MD PhD — Vice Chair of Practice Transformation,<br />
            Director, Center for High Value Imaging, UW-Madison
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400">
        MedBench v0.1 POC · Inspired by{" "}
        <a
          href="https://ai.meta.com/research/publications/neuralbench-a-unifying-framework-to-benchmark-neuroai-models/"
          className="underline hover:text-slate-600"
          target="_blank"
          rel="noreferrer"
        >
          NeuralBench (Meta AI)
        </a>{" "}
        · Built on{" "}
        <a
          href="https://mlcommons.org/working-groups/data/medical/"
          className="underline hover:text-slate-600"
          target="_blank"
          rel="noreferrer"
        >
          MedPerf
        </a>{" "}
        principles
      </footer>
    </main>
  );
}
