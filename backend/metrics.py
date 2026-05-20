from sklearn.metrics import roc_auc_score
import numpy as np
from schema import SubgroupResult


def compute_auc(labels: list[int], scores: list[float]) -> float:
    if len(set(labels)) < 2:
        return 0.5
    return round(float(roc_auc_score(labels, scores)), 3)


def compute_sensitivity_specificity(
    labels: list[int], scores: list[float], threshold: float = 0.5
) -> tuple[float, float]:
    preds = [1 if s >= threshold else 0 for s in scores]
    tp = sum(1 for l, p in zip(labels, preds) if l == 1 and p == 1)
    tn = sum(1 for l, p in zip(labels, preds) if l == 0 and p == 0)
    fp = sum(1 for l, p in zip(labels, preds) if l == 0 and p == 1)
    fn = sum(1 for l, p in zip(labels, preds) if l == 1 and p == 0)

    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    return round(sensitivity, 3), round(specificity, 3)


def subgroup_analysis(cases: list[dict], model_id: str) -> list[SubgroupResult]:
    results = []
    dimensions = {
        "sex": ["male", "female"],
        "age_group": ["18-40", "41-60", "61+"],
        "scanner": ["GE", "Siemens", "Philips"],
    }

    for dim, values in dimensions.items():
        for val in values:
            subset = [c for c in cases if c[dim] == val]
            if len(subset) < 5:
                continue
            labels = [1 if c["ground_truth"] == "pneumonia" else 0 for c in subset]
            scores = [c["predictions"][model_id]["confidence"] for c in subset]
            auc = compute_auc(labels, scores)
            sens, spec = compute_sensitivity_specificity(labels, scores)
            results.append(SubgroupResult(
                group_name=dim,
                group_value=val,
                n=len(subset),
                auc=auc,
                sensitivity=sens,
                specificity=spec,
            ))
    return results


def bias_flag(overall_auc: float, subgroup_results: list[SubgroupResult]) -> tuple[bool, str | None]:
    worst = min(subgroup_results, key=lambda r: r.auc)
    gap = overall_auc - worst.auc
    if gap > 0.05:
        label = f"{worst.group_value.capitalize()} patients" if worst.group_name == "sex" else f"{worst.group_value} age group"
        return True, f"{label} ({gap*100:.0f}% AUC gap vs. overall)"
    return False, None
