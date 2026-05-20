# HOW TO RUN — MedBench POC

Two terminals. Five minutes. No ML engineering required.

---

## Prerequisites

- **Python 3.11+** (`python3 --version`)
- **Node.js 18+** (`node --version`)

---

## Terminal 1 — Start the Backend

```bash
cd backend

# First time only: create a virtual environment and install dependencies
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

# Start the API server
./venv/bin/uvicorn main:app --reload --port 8000
```

You should see:
```
INFO: Uvicorn running on http://127.0.0.1:8000
```

Verify it's running: open [http://localhost:8000/health](http://localhost:8000/health) — you should see `{"status":"ok","version":"0.1.0"}`.

---

## Terminal 2 — Start the Frontend

```bash
cd frontend
npm install      # first time only
npm run dev
```

You should see:
```
▲ Next.js 16.x.x
- Local: http://localhost:3000
```

---

## Use the App

Open [http://localhost:3000](http://localhost:3000).

### Option A — View Sample Report (no backend needed)
Click **"View Sample Report"** on the landing page. This loads pre-baked demo results instantly — no API call needed. Good for demoing the UI without running the full benchmark.

### Option B — Run a Live Benchmark
1. Click **"Run a Benchmark →"**
2. **Step 1:** Choose Chest X-Ray / Pneumonia Detection / Adult ICU (only options available in POC)
3. **Step 2:** Select which models to compare (all 3 are checked by default)
4. **Step 3:** Review your selections and click **"Run Benchmark →"**
5. Watch the **progress screen** — three models evaluate in parallel, takes ~30 seconds
6. The app auto-redirects to the **results dashboard** when done

### Download the PDF Report
On the results page, click **"Download Governance Report (PDF)"**. This generates a professional report with:
- Executive summary
- Model comparison table with bias flags
- Subgroup performance breakdown
- Methodology appendix
- Governance sign-off blocks (for committee review)

---

## What the Results Mean

| Metric | What it tells you |
|---|---|
| **AUC** | Overall discriminative ability — higher is better. 0.5 = random, 1.0 = perfect |
| **Sensitivity** | How often the model catches real cases (true positive rate) |
| **Specificity** | How often the model correctly clears healthy patients (true negative rate) |
| **Bias flag** | Any subgroup where AUC drops >5% below the overall — a population where the model underperforms |

### Reading the subgroup charts
- **Blue bars**: performance within 5% of overall AUC — acceptable
- **Red bars**: performance gap >5% — bias flag threshold

In the demo, **CheXNet is flagged** because its AUC for the 61+ age group (0.846) is 9% below its overall AUC (0.933). **BioViL-T** and **Vendor X** show no such gaps.

---

## Demo Data

The POC uses 500 synthetic cases modeled after the CheXpert dataset format:
- 30% positive rate (pneumonia)
- Demographics: sex, age group (18-40 / 41-60 / 61+), scanner (GE / Siemens / Philips)
- No real patient data — all values are synthetically generated

Three model profiles are simulated:
- **CheXNet** — high overall AUC, intentionally biased against patients 61+ (to demonstrate bias detection)
- **BioViL-T** — slightly lower overall AUC, equitable across all subgroups (recommended by the tool)
- **Vendor Model X** — lower sensitivity, highest specificity (conservative — minimizes false alarms)

---

## Project Structure

```
medical-ai-benchmarker/
├── backend/
│   ├── main.py          # FastAPI app — API routes
│   ├── schema.py        # Pydantic data models
│   ├── demo_data.py     # Synthetic CheXpert-style cases (500 cases)
│   ├── metrics.py       # AUC, sensitivity, specificity, subgroup slicing, bias detection
│   ├── runner.py        # Benchmark execution loop (async, background task)
│   ├── report.py        # PDF report generator (fpdf2)
│   └── requirements.txt
│
├── frontend/
│   └── app/
│       ├── page.tsx                          # Landing page
│       ├── benchmark/new/page.tsx            # 3-step task wizard
│       ├── benchmark/[id]/page.tsx           # Live progress (polls backend every 1s)
│       ├── benchmark/[id]/results/page.tsx   # Results dashboard + subgroup charts
│       └── benchmark/demo/results/page.tsx   # Static demo (no backend needed)
│
├── README.md          # Product overview and problem statement
├── PLAN.md            # Timeline, UI design, tech stack decisions
├── ARCHITECTURE.md    # System architecture, vendor API landscape, CHVI pitch guide
└── HOW_TO_RUN.md      # This file
```

---

## Next Steps (Post-POC)

1. **Email Dr. Dania Daye** at UW CHVI — show her the live demo, ask for a 20-minute meeting
2. **Email Dr. Alan McMillan** at UW ML4MI — he's evaluating foundation models + agents with Microsoft right now; Problem 6 (agent benchmarking) is his domain
3. **Submit to Launch Wisconsin** by June 15, 2026 — [launchwisconsin.biz](https://launchwisconsin.biz)
4. Replace synthetic data with a real CheXpert subset for a more credible demo
5. Add the MedBench Agent (Docker container) so data truly stays on-premises
