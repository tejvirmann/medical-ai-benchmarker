import asyncio
import time
from datetime import datetime

from demo_data import DEMO_CASES
from metrics import compute_auc, compute_sensitivity_specificity, subgroup_analysis, bias_flag
from schema import BenchmarkRequest, BenchmarkRun, BenchmarkStatus, ModelResult

MODEL_META = {
    "chexnet": {"name": "CheXNet", "source": "Stanford (open source)", "latency_ms": 42.0},
    "biovil": {"name": "BioViL-T", "source": "Microsoft Research (open source)", "latency_ms": 67.0},
    "vendor_x": {"name": "Vendor Model X", "source": "Proprietary (demo)", "latency_ms": 28.0},
}

# In-memory store — fine for POC
runs: dict[str, BenchmarkRun] = {}


def _get_selected_models(request: BenchmarkRequest) -> list[str]:
    selected = []
    if request.models.chexnet:
        selected.append("chexnet")
    if request.models.biovil:
        selected.append("biovil")
    if request.models.vendor_x:
        selected.append("vendor_x")
    return selected


async def run_benchmark(run_id: str) -> None:
    run = runs[run_id]
    run.status = BenchmarkStatus.running
    cases = DEMO_CASES
    run.n_cases = len(cases)
    selected_models = _get_selected_models(run.request)
    results = []

    for model_id in selected_models:
        # Simulate incremental progress over ~8 seconds
        steps = 10
        for step in range(steps):
            await asyncio.sleep(0.8)
            run.progress_by_model[model_id] = int((step + 1) / steps * 100)
            # Overall progress = average across all models
            run.progress = int(
                sum(run.progress_by_model.get(m, 0) for m in selected_models)
                / len(selected_models)
            )

        labels = [1 if c["ground_truth"] == "pneumonia" else 0 for c in cases]
        scores = [c["predictions"][model_id]["confidence"] for c in cases]

        auc = compute_auc(labels, scores)
        sensitivity, specificity = compute_sensitivity_specificity(labels, scores)
        subgroups = subgroup_analysis(cases, model_id)
        flagged, flag_desc = bias_flag(auc, subgroups)
        meta = MODEL_META[model_id]

        results.append(ModelResult(
            model_id=model_id,
            model_name=meta["name"],
            model_source=meta["source"],
            auc=auc,
            sensitivity=sensitivity,
            specificity=specificity,
            bias_flagged=flagged,
            bias_description=flag_desc,
            subgroups=subgroups,
            latency_ms=meta["latency_ms"],
        ))

    run.results = results
    run.progress = 100
    run.status = BenchmarkStatus.complete
    run.summary = _generate_summary(results)


def _generate_summary(results: list[ModelResult]) -> str:
    best_equitable = next(
        (r for r in sorted(results, key=lambda r: r.auc, reverse=True) if not r.bias_flagged),
        None,
    )
    flagged = [r for r in results if r.bias_flagged]

    parts = []
    if best_equitable:
        parts.append(
            f"{best_equitable.model_name} achieves the highest AUC ({best_equitable.auc:.2f}) "
            f"among models with no detected subgroup bias — recommended for diverse patient populations."
        )
    for r in flagged:
        parts.append(
            f"{r.model_name} is flagged for bias: {r.bias_description}. "
            f"Review subgroup performance before deployment in heterogeneous populations."
        )
    return " ".join(parts)
