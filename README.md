# MedBench
For AI Native Radiology Labs

A neutral, UI-first benchmarking and monitoring platform for clinical AI. Built so that doctors — not data scientists — can evaluate, compare, and monitor AI models on their own patient population.

Inspired by [NeuralBench](https://ai.meta.com/research/publications/neuralbench-a-unifying-framework-to-benchmark-neuroai-models/) (Meta, 2026) — the same principle of standardized, fair, reproducible model evaluation, applied to clinical radiology and medical imaging.

---

## The Problem

Dr. Dania Daye (Vice Chair of Practice Transformation, inaugural Director of the [Center for High Value Imaging](https://www.radiology.wisc.edu/chvi#hub), UW-Madison) calls it "the last mile" — AI works in research but fails in clinical reality. There are five distinct failure points:

**1. No neutral pre-purchase evaluation**
Hospitals evaluating AI vendors compare published accuracy numbers from different datasets. Vendor A tested on CheXpert. Vendor B tested on MIMIC-CXR. Those are different populations. The comparison is meaningless. Hospitals sign $500k contracts based on vendor-provided slide decks.

**2. Hidden bias across patient populations**
A model trained at Mass General may fail at UW Health. Different patient demographics, different scanner manufacturers, different disease prevalence. No vendor discloses this. Subgroup performance gaps — by age, sex, race, scanner type — are invisible until something goes wrong clinically.

**3. No governance artifact**
AI governance committees meet to decide which models to deploy. They have no standardized document to review — just vendor pitches. There is no equivalent of a drug trial report for clinical AI. The governance process is entirely subjective.

**4. Integration is untested**
FDA clearance means a model works in a lab setting. It does not mean the model integrates with Epic, responds in under two seconds, handles corrupted DICOM files gracefully, or fits into a radiologist's actual workflow. These are never tested before go-live.

**5. No one watches after deployment**
Once deployed, models are a black box. Scanners get upgraded, patient populations shift, disease prevalence changes — models silently degrade. There is no monitoring. No one gets alerted. Radiologists notice something feels off months later, if at all.

**6. No one knows how to benchmark AI agents doing clinical reasoning**
The frontier of clinical AI is no longer a single model reading a single image. It is an AI agent that retrieves patient records, analyzes imaging, cross-references lab values, and produces a triage decision with written reasoning — all autonomously. Dr. Alan McMillan at UW-Madison (ML4MI Lab, Section Chief of Imaging Sciences) is already running seminars with Microsoft on exactly this: medical imaging foundation models and AI agents operating in clinical workflows.

Standard benchmarking tools — AUC, sensitivity, specificity — cannot evaluate agents. An agent's output is not a single prediction. It is a sequence of decisions. Three things can fail independently: the final answer, the reasoning chain that produced it, and the tools it chose to call. A triage agent that reaches the right answer via hallucinated reasoning is more dangerous than one that says "I'm not sure." No standardized evaluation framework for clinical AI agents exists today.

---

## What Hospitals and Doctors Do Today

These are the current alternatives — and why each is insufficient:

| Option | What it is | Why it falls short |
|---|---|---|
| **Vendor's published paper** | Accuracy numbers on the vendor's own dataset | Cherry-picked data, not your population, no subgroup analysis |
| **Internal pilot / shadow mode** | Hospital runs the model in parallel for a few weeks | No standardized metrics, no comparison baseline, no documentation |
| **FDA clearance** | 510(k) approval via substantial equivalence | Regulatory, not performance. Doesn't mean it works at your institution |
| **MedPerf (MLCommons)** | Open-source federated benchmarking framework | No UI, requires engineering team to set up, no SLA, not a service |
| **Censinet / Fiddler AI** | Generic ML monitoring and risk tools | Not imaging-specific, no clinical workflow context |
| **Aidoc BRIDGE** | Benchmarking framework by Aidoc | Built by a vendor — direct conflict of interest |
| **Academic benchmarks** (RadBench, TumorImagingBench) | Research papers comparing models on curated datasets | Academic datasets only, no real-world deployment context, no UI |
| **URAC accreditation** | Compliance checklist for AI programs | Checkbox exercise, not a performance benchmark |

The gap: there is no **neutral, independent, UI-friendly service** that lets a hospital run its own labeled data against multiple AI vendors and get back a clear, clinician-readable report.

---

## What MedBench Does

```
Doctor defines a clinical task
    → e.g. "Detect pneumonia on chest X-rays in our ICU population"

Selects models to compare
    → FDA-cleared vendors + open-source foundation models

Uploads or connects validation data
    → Labeled cases from their own institution (data never leaves)

MedBench runs evaluation
    → Standardized preprocessing, same pipeline for every model

Gets back a report
    → AUC, sensitivity, specificity — broken down by age, sex, race, scanner
    → Plain-language summary: "Model B performs 12% worse for women over 60"
    → Governance-ready PDF artifact

Ongoing monitoring (optional)
    → Re-runs benchmark monthly, alerts when performance drops
```

---

## The Secret Sauce

The technology is not the moat. The moat is making this so easy that a radiologist can run a benchmark in the same amount of time it takes to fill out a referral form.

Every existing solution requires an engineering team. MedBench requires a browser.

---

## Key Links

- [Dania Daye — "The Last Mile to Clinical AI Deployment" (AuntMinnie)](https://www.auntminnie.com/resources/conference/ismrm/2025/article/15745573/video-from-ismrm-dania-daye-on-the-last-mile-to-clinical-ai-deployment)
- [Center for High Value Imaging — UW Health](https://www.radiology.wisc.edu/chvi#hub)
- [NeuralBench — Meta AI Research (inspiration)](https://ai.meta.com/research/publications/neuralbench-a-unifying-framework-to-benchmark-neuroai-models/)
- [MedPerf — MLCommons (technical prior art)](https://mlcommons.org/working-groups/data/medical/)
- [FDA AI-Enabled Medical Devices](https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-enabled-medical-devices)
