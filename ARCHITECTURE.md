# MedBench — Architecture & Implementation Plan

## The Core Insight on Bottlenecks

You identified the right problem. Data structure is the hardest issue, and it should be the first thing you build. Here's why:

Every hospital stores data differently. A DICOM file from a GE scanner at UW Health is formatted differently from one at Johns Hopkins. The label schema a radiologist uses to annotate findings differs by institution. HL7 messages from Epic differ from those from Cerner. If you try to run a benchmark on top of this chaos, you get garbage results — not because the models are bad, but because they were fed inconsistent inputs.

**The right order:** Build the data translation layer first. Everything else — model evaluation, agent scoring, drift monitoring, the UI — sits on top of a clean, standardized data foundation. Without it, fair comparison is impossible.

---

## System Architecture

```
╔══════════════════════════════════════════════════════════════════════╗
║                    LAYER 0: DATA INGESTION                          ║
║                    (Build this first)                               ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  Hospital sources:                                                   ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   ║
║  │  DICOM   │  │ FHIR R4  │  │  HL7 v2  │  │ CSV / spreadsheet│   ║
║  │ (imaging)│  │(records) │  │  (labs)  │  │ (labeled cases)  │   ║
║  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   ║
║       │              │              │                  │             ║
║       └──────────────┴──────────────┴──────────────────┘            ║
║                                    │                                 ║
║                          ┌─────────▼──────────┐                    ║
║                          │  MedBench Adapter  │                    ║
║                          │                    │                    ║
║                          │ • Parses formats   │                    ║
║                          │ • Normalizes pixels│                    ║
║                          │ • Resolves labels  │                    ║
║                          │ • Validates schema │                    ║
║                          └─────────┬──────────┘                    ║
║                                    │                                 ║
║                          ┌─────────▼──────────┐                    ║
║                          │  BenchmarkCase     │  ← standard format ║
║                          │  {                 │                    ║
║                          │    id: string      │                    ║
║                          │    modality: enum  │                    ║
║                          │    image: tensor   │                    ║
║                          │    metadata: {...} │                    ║
║                          │    ground_truth:   │                    ║
║                          │      label: string │                    ║
║                          │      subgroups: {} │                    ║
║                          │  }                 │                    ║
║                          └─────────┬──────────┘                    ║
╚════════════════════════════════════╪════════════════════════════════╝
                                     │
╔════════════════════════════════════╪════════════════════════════════╗
║                    LAYER 1: MODEL ADAPTER                           ║
╠════════════════════════════════════╪════════════════════════════════╣
║                                    │                                 ║
║   Standard interface every model must implement:                    ║
║   ┌─────────────────────────────────────────────────────────────┐  ║
║   │  class MedBenchModel:                                       │  ║
║   │    def load(weights_path)                                   │  ║
║   │    def preprocess(BenchmarkCase) → tensor                   │  ║
║   │    def predict(tensor) → prediction                         │  ║
║   │    def postprocess(prediction) → StructuredFinding          │  ║
║   └─────────────────────────────────────────────────────────────┘  ║
║                                                                      ║
║   Adapters built for:                                               ║
║   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  ║
║   │ HuggingFace      │ │ Vendor REST API  │ │ LLM / Agent      │  ║
║   │ (open source)    │ │ (where available)│ │ (GPT-4o, Claude) │  ║
║   │                  │ │                  │ │                  │  ║
║   │ CheXNet          │ │ AWS HealthLake   │ │ Multimodal +     │  ║
║   │ BioViL-T         │ │ Google Health    │ │ tool use eval    │  ║
║   │ MedImageInsight  │ │ Azure AI Health  │ │                  │  ║
║   └──────────────────┘ └──────────────────┘ └──────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════╝
                                     │
╔════════════════════════════════════╪════════════════════════════════╗
║                    LAYER 2: EVALUATION ENGINE                       ║
╠════════════════════════════════════╪════════════════════════════════╣
║                                                                      ║
║   Model evaluation (Problems 1–5):                                  ║
║   ┌─────────────────────────────────────────────────────────────┐  ║
║   │  MetricsEngine                                              │  ║
║   │  • AUC, sensitivity, specificity, F1, Brier score          │  ║
║   │  • Subgroup slicing (age, sex, race, scanner, site)        │  ║
║   │  • Statistical significance testing                        │  ║
║   │  • Calibration curves                                      │  ║
║   └─────────────────────────────────────────────────────────────┘  ║
║                                                                      ║
║   Agent evaluation (Problem 6 — McMillan's domain):                ║
║   ┌─────────────────────────────────────────────────────────────┐  ║
║   │  AgentEvaluator                                             │  ║
║   │  • Task completion: did it answer the clinical question?   │  ║
║   │  • Reasoning fidelity: are cited findings real?            │  ║
║   │  • Tool use correctness: right calls, right order?        │  ║
║   │  • Safety score: hallucination detection                   │  ║
║   │  • Latency: wall-clock time per decision                   │  ║
║   │  • Uncertainty calibration: does it know when it's wrong? │  ║
║   └─────────────────────────────────────────────────────────────┘  ║
║                                                                      ║
║   Drift detection (Problem 5):                                      ║
║   ┌─────────────────────────────────────────────────────────────┐  ║
║   │  DriftMonitor                                               │  ║
║   │  • Scheduled re-evaluation on holdout set                  │  ║
║   │  • Statistical drift detection (PSI, KS test)             │  ║
║   │  • Alert thresholds per metric per model                   │  ║
║   └─────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════╝
                                     │
╔════════════════════════════════════╪════════════════════════════════╗
║                    LAYER 3: REPORTING & UI                          ║
╠════════════════════════════════════╪════════════════════════════════╣
║                                                                      ║
║  ┌───────────────────────┐    ┌───────────────────────────────┐    ║
║  │   Web Dashboard       │    │   Governance PDF Export       │    ║
║  │   (Next.js)           │    │                               │    ║
║  │                       │    │   • Executive summary         │    ║
║  │   • Task wizard       │    │   • Per-model scorecard       │    ║
║  │   • Model catalog     │    │   • Bias/subgroup tables      │    ║
║  │   • Live run progress │    │   • Recommendation            │    ║
║  │   • Results dashboard │    │   • Methodology appendix      │    ║
║  │   • Drift timeline    │    │   • Signature blocks for      │    ║
║  │   • Alert config      │    │     committee sign-off        │    ║
║  └───────────────────────┘    └───────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Layer 0 in Detail: The Data Translation Problem

This is where most of the hard engineering lives. Here's what each adapter must handle:

### DICOM (medical imaging)
- Parse `.dcm` files using `pydicom`
- Normalize pixel values (different scanners use different windowing defaults)
- Extract DICOM tags: scanner manufacturer, model, acquisition parameters
- Handle multi-frame (CT, MRI series) vs single-frame (X-ray)
- De-identification: strip patient identifiers before any processing

### FHIR R4 (structured clinical records)
- Pull `Patient`, `Observation`, `DiagnosticReport`, `ImagingStudy` resources
- Map LOINC codes to human-readable labels
- Handle missing fields gracefully (real clinical data is always incomplete)

### Ground truth labels
The hardest part. Labels come in five forms today:
```
1. Radiology report text    → requires NLP to extract structured finding
2. Structured annotation    → radiologist drew a bounding box in a tool
3. ICD-10 billing codes     → coarse, often lags the actual encounter
4. Spreadsheet from PI      → inconsistent, researcher-specific schema
5. FHIR DiagnosticReport    → the most structured, but least common
```

Your standard `BenchmarkCase.ground_truth` schema normalizes all of these into one format. This is the core IP of the data layer.

---

## On Vendor APIs: The Honest Picture

Most FDA-cleared vendors **do not** offer a public API. Here is the actual breakdown:

| Vendor | API available? | Access model |
|---|---|---|
| GE HealthCare, Siemens, Philips | No public API | Integrated via DICOM worklist into hospital PACS — you can't call them externally |
| Aidoc | Enterprise only | Requires a contract, no sandbox |
| Rad AI | Enterprise only | Requires a contract |
| Paige.AI | Enterprise only | Requires a contract |
| **Google Health (CXR Foundation)** | Research API | Available for non-commercial research |
| **Azure AI Health Insights** | Public API | Microsoft's clinical NLP and imaging service |
| **AWS HealthLake Imaging** | Public API | DICOM storage and retrieval via API |
| **HuggingFace open-source models** | Free | Download weights directly, run locally |
| **GPT-4o / Claude / Gemini** | Public API | Multimodal — pass images directly |

**For the POC:** use HuggingFace models (free, no contract) and LLM APIs (GPT-4o/Claude for agent evaluation). This gives you a working product on day one.

**For the pitch to vendors:** frame your platform as a certification opportunity. "Pass our benchmark and display the MedBench badge." That flips the dynamic — vendors come to you.

---

## Who Is CHVI and What Do You Need to Show Them

**CHVI = Center for High Value Imaging** at UW Health.

Dania Daye is its inaugural director, hired April 2025. It is brand new. She is actively looking for tools and partnerships to define what the center does. This is the best possible timing — she has no entrenched vendor relationships yet.

The center sits at the intersection of:
- **UW Health** (the hospital system — Epic, real patients, real imaging data)
- **UW School of Medicine** (academic credibility, research IRB access)
- **UW Radiology Department** (radiologists who would use your tool)

Alan McMillan's ML4MI lab is the research arm doing the technical AI work. Dania Daye's CHVI is the clinical deployment arm trying to operationalize it. **You are the missing piece between them** — the evaluation layer that turns McMillan's research models into something Daye can put in front of a governance committee.

### What you need to show them to get a pilot

You are not selling. You are asking for a collaboration. The ask is:
> "Let us run a 90-day evaluation pilot at no cost. We benchmark 2–3 models on your existing labeled validation cases. You get a free governance-ready report. We validate our platform on real institutional data."

To get a yes, you need to show four things:

**1. It actually works — a live demo**
Not a slide deck. A running product that takes labeled chest X-ray cases and produces a comparison report in under 10 minutes. This is the POC.

**2. Data never leaves UW Health**
The single biggest concern for any hospital. Show them the architecture diagram. The MedBench Agent runs inside their firewall. Only aggregate metrics travel outward. No HIPAA risk.

**3. The output is useful to their governance committee**
Show them a sample PDF report. It should look like something their AI governance committee would actually review and file. Signature blocks, methodology appendix, plain-language summary. Not a Jupyter notebook printout.

**4. You are not a liability**
Your terms make clear you are providing an evaluation tool, not a clinical decision system. You are not responsible for deployment decisions. A one-paragraph disclaimer handles this — but have it ready.

---

## Build Sequence (addressing bottlenecks first)

```
Week 1  ── DATA LAYER
        ├── DICOM parser + pixel normalizer
        ├── BenchmarkCase schema (the standard format)
        ├── Ground truth label adapter (supports CSV + FHIR)
        └── De-identification pipeline

Week 2  ── MODEL ADAPTERS + EVAL ENGINE
        ├── MedBenchModel interface
        ├── 3 HuggingFace model wrappers (CheXNet, BioViL-T, one more)
        ├── MetricsEngine (AUC, subgroup slicing)
        └── AgentEvaluator stub (task completion + latency for POC)

Week 3  ── UI (POC quality)
        ├── Task setup wizard (Screen 1–2)
        ├── Live run progress (Screen 3)
        ├── Results dashboard with charts (Screen 4)
        └── PDF export (basic)

Week 4  ── POLISH + PITCH PREP
        ├── Demo script using CheXpert data
        ├── Sample governance PDF
        ├── Cold outreach to Daye + McMillan with demo link
        └── Launch Wisconsin application draft
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Data parsing | `pydicom`, `pynetdicom`, `fhir.resources` | Standard Python medical imaging libraries |
| ML / model execution | PyTorch + HuggingFace transformers | Access to all open-source radiology models |
| Metrics | `scikit-learn`, `scipy` | AUC, subgroup slicing, statistical tests |
| Agent execution | Anthropic SDK / OpenAI SDK | Run LLM agents, capture tool call traces |
| Backend API | FastAPI (Python) | Async, fast, ML ecosystem native |
| Frontend | Next.js 15 + Tailwind + shadcn/ui | Clean design, fast to build |
| Charts | Recharts | Simple, composable |
| PDF | WeasyPrint | HTML → PDF, easiest to style |
| Demo dataset | CheXpert (Stanford, 224k X-rays) | Public, de-identified, real clinical data |
| Auth (later) | Clerk or Supabase Auth | Not needed for POC |

---

## File Structure

```
medical-ai-benchmarker/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── adapter/
│   │   ├── dicom.py             # DICOM → BenchmarkCase
│   │   ├── fhir.py              # FHIR → BenchmarkCase
│   │   └── csv_labels.py        # CSV ground truth → BenchmarkCase
│   ├── models/
│   │   ├── base.py              # MedBenchModel interface
│   │   ├── chexnet.py           # CheXNet wrapper
│   │   ├── biovil.py            # BioViL-T wrapper
│   │   └── llm_agent.py        # GPT-4o / Claude agent wrapper
│   ├── eval/
│   │   ├── metrics.py           # AUC, sensitivity, subgroup slicing
│   │   ├── agent_eval.py        # Agent-specific scoring
│   │   └── drift.py             # Drift detection
│   ├── report/
│   │   └── generator.py         # PDF report builder
│   └── schema.py                # BenchmarkCase, StructuredFinding types
│
├── frontend/
│   └── app/
│       ├── page.tsx             # Landing
│       ├── benchmark/
│       │   ├── new/page.tsx     # Task wizard
│       │   ├── [id]/page.tsx    # Live progress
│       │   └── [id]/results/    # Results dashboard
│       └── monitoring/page.tsx  # Drift timeline
│
├── data/
│   └── chexpert_sample/         # Demo dataset (subset, local)
│
├── README.md
├── PLAN.md
└── ARCHITECTURE.md
```
