# MedBench — Implementation Plan

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HOSPITAL / INSTITUTION                        │
│                                                                      │
│  ┌──────────────┐     ┌─────────────────────────────────────────┐   │
│  │ Labeled Data │────▶│         MedBench Agent (Docker)         │   │
│  │ (DICOM/FHIR) │     │                                         │   │
│  └──────────────┘     │  1. Pulls model from MedBench catalog   │   │
│                        │  2. Runs model locally on your data     │   │
│                        │  3. Computes metrics locally            │   │
│                        │  4. Sends ONLY metrics back (no images) │   │
│                        └──────────────┬──────────────────────────┘   │
│                                       │ metrics only                  │
└───────────────────────────────────────┼─────────────────────────────┘
                                        │
                    ────────────────────▼──────────────────────
                                   MEDBENCH CLOUD
                    ────────────────────────────────────────────
                        │                          │
              ┌─────────▼──────────┐   ┌──────────▼──────────┐
              │   Results Store    │   │   Model Catalog      │
              │  (metrics, runs,   │   │  (FDA-cleared tools, │
              │   history, alerts) │   │   open-source models)│
              └─────────┬──────────┘   └─────────────────────┘
                        │
              ┌─────────▼──────────┐
              │    Web Dashboard   │
              │                    │
              │  • Task setup      │
              │  • Model selection │
              │  • Results view    │
              │  • Drift timeline  │
              │  • Export PDF      │
              └────────────────────┘
                        │
              ┌─────────▼──────────┐
              │  Radiologist / MD  │
              │  (no ML knowledge  │
              │   required)        │
              └────────────────────┘
```

**Core principle: data never leaves the hospital.** The MedBench Agent runs inside the hospital's firewall. Only aggregate metrics travel to the cloud. This is how HIPAA compliance is maintained.

---

## The Standard Model Interface

Every model in the MedBench catalog — whether a vendor's FDA-cleared tool or an open-source foundation model — must conform to a single interface. This is what makes fair comparison possible.

```python
class MedBenchModel:
    def load(self, weights_path: str) -> None
    def preprocess(self, dicom_path: str) -> torch.Tensor
    def predict(self, tensor: torch.Tensor) -> dict
    # returns: {"label": str, "confidence": float, "heatmap": np.ndarray}
    def postprocess(self, prediction: dict) -> StructuredFinding
```

Any model that implements this gets fair, reproducible evaluation. This is the same design insight as NeuralBench — one interface, many models, results you can actually compare.

---

## Phase 1 — POC (Now → June 15, pitch)

**Goal:** A clickable demo that shows the core benchmark loop end-to-end.
**Dataset:** CheXpert (public, Stanford, 224k chest X-rays, already de-identified)
**Models:** 3 open-source radiology models from HuggingFace
**Data stays:** Everything runs locally for the demo (no agent needed yet)

### What to build

```
frontend/          Next.js + Tailwind + shadcn/ui
├── app/
│   ├── page.tsx              → Landing / task setup wizard
│   ├── benchmark/
│   │   ├── new/page.tsx      → Step-by-step task configuration
│   │   ├── [id]/page.tsx     → Live progress view
│   │   └── [id]/results/     → Results dashboard
│   └── monitoring/page.tsx   → Drift timeline (simulated for POC)

backend/           Python FastAPI
├── main.py
├── runner.py      → Benchmark execution loop
├── models/        → Model wrappers (3 HuggingFace models)
├── metrics.py     → AUC, sensitivity, specificity, subgroup slicing
└── report.py      → PDF generation
```

### UI Flow (4 screens)

```
Screen 1 — Task Setup
┌─────────────────────────────────────────────┐
│  What do you want to evaluate?              │
│                                             │
│  Modality:    [Chest X-Ray ▼]              │
│  Task:        [Pneumonia Detection ▼]       │
│  Population:  [Adult ICU ▼]                │
│                                             │
│  [Upload labeled cases]  or  [Use demo data]│
│                                             │
│                          [Next →]           │
└─────────────────────────────────────────────┘

Screen 2 — Model Selection
┌─────────────────────────────────────────────┐
│  Which models do you want to compare?       │
│                                             │
│  ☑ CheXNet (Stanford, open source)         │
│  ☑ BioViL-T (Microsoft Research)           │
│  ☑ [Your vendor model — upload weights]    │
│  ☐ GPT-4o Vision (LLM baseline)           │
│                                             │
│                [← Back]  [Run Benchmark →] │
└─────────────────────────────────────────────┘

Screen 3 — Live Progress
┌─────────────────────────────────────────────┐
│  Running benchmark...                       │
│                                             │
│  CheXNet      ████████████░░░░  73%        │
│  BioViL-T     ███░░░░░░░░░░░░░  21%        │
│  Vendor Model ░░░░░░░░░░░░░░░░   0%        │
│                                             │
│  Est. time remaining: 4 min                 │
└─────────────────────────────────────────────┘

Screen 4 — Results Dashboard
┌─────────────────────────────────────────────┐
│  BENCHMARK RESULTS — Pneumonia Detection    │
│  Chest X-Ray · Adult ICU · UW Health data  │
│                                             │
│         AUC    Sens   Spec   Bias Flag      │
│  CheXNet  0.91   84%   93%   ⚠ Women -12%  │
│  BioViL   0.89   88%   89%   ✓ No gaps     │
│  Vendor   0.87   79%   94%   ✓ No gaps     │
│                                             │
│  Summary: BioViL performs most equitably.  │
│  CheXNet shows a clinically significant    │
│  performance gap in women over 60.         │
│                                             │
│  [Export PDF Report]  [Set Up Monitoring]  │
└─────────────────────────────────────────────┘
```

### Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 + Tailwind + shadcn/ui | Fast to build, clean design system |
| Charts | Recharts | Simple, composable |
| Backend | Python FastAPI | ML ecosystem, async, fast |
| ML | HuggingFace transformers + PyTorch | Access to radiology foundation models |
| PDF | WeasyPrint or reportlab | Governance-ready exports |
| Demo data | CheXpert (local subset) | Public, de-identified, real clinical data |

---

## Phase 2 — Pilot (Post-pitch → Q4 2026)

- Deploy MedBench Agent as a Docker container hospitals can run on-premises
- Connect to Epic via FHIR R4 for pulling labeled cases
- Add vendor onboarding: model submission + sandboxed evaluation
- Real-time drift monitoring with configurable alert thresholds
- SOC 2 Type I compliance process begins
- Pilot with CHVI at UW Health (target: Dr. Dania Daye / Dr. Alan McMillan)

---

## Phase 3 — Service (2027)

- Model Catalog: self-serve vendor submission portal
- Multi-institution benchmarking (same model, five hospitals, one report)
- Regulatory package export: FDA post-market surveillance documentation
- SLA-backed monitoring with uptime guarantees
- HIPAA BAA + enterprise contracts

---

## Hard Problems (read this carefully)

See the bottom of this file for a full breakdown. These are the places where the product will get stuck.

---

## Personnel for Launch Wisconsin Pitch (June 15)

| Role | Who | Status |
|---|---|---|
| Founder / Product | You | ✓ |
| Clinical Advisor | Dr. Dania Daye (target) | Cold outreach needed |
| Technical Advisor | Dr. Alan McMillan (target) | Cold outreach needed |
| Co-founder / Engineer | TBD | Recruiting |
| Business / Commercialization | UW WARF or business school contact | Warm via UW network |

**Pitch ask:** Clinical partnership with CHVI for a 90-day pilot. Not a sale — a collaboration.

---

## Timeline to June 15

```
May 20–24   Build POC (automated)
May 24–27   Polish UI, record 2-min demo video
May 27      Cold email Dr. Daye + Dr. McMillan — lead with the demo
May 28–Jun 3  Refine based on their feedback (if they respond)
Jun 3–10    Build pitch deck, define business model, identify co-founder
Jun 10–15   Submit Launch Wisconsin application
```
