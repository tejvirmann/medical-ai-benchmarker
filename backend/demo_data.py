import random
from typing import Any

random.seed(42)

SCANNERS = ["GE", "Siemens", "Philips"]
SEXES = ["male", "female"]
AGE_GROUPS = ["18-40", "41-60", "61+"]

# Target AUC profile:
#   CheXNet:  ~0.89 overall, biased against female/61+ (AUC ~0.78 for that subgroup)
#   BioViL-T: ~0.87 overall, equitable (no subgroup gap > 0.05)
#   Vendor X: ~0.84 overall, high specificity, equitable
#
# AUC is driven by how well the confidence scores separate positives from negatives.
# We use 500 cases for stable subgroup estimates.


def _clamp(v: float) -> float:
    return max(0.02, min(0.98, v))


def _chexnet_confidence(ground_truth: str, sex: str, age_group: str) -> float:
    biased_group = sex == "female" and age_group == "61+"
    if ground_truth == "pneumonia":
        # Biased group: model misses positives → lower confidence on true positives
        base = 0.52 if biased_group else 0.72
    else:
        # Biased group: more false positives too
        base = 0.46 if biased_group else 0.32
    return _clamp(random.gauss(base, 0.14))


def _biovil_confidence(ground_truth: str, sex: str, age_group: str) -> float:
    # Consistent across all subgroups
    base = 0.69 if ground_truth == "pneumonia" else 0.33
    return _clamp(random.gauss(base, 0.14))


def _vendor_x_confidence(ground_truth: str, sex: str, age_group: str) -> float:
    # Conservative: lower sensitivity, low false-positive rate
    base = 0.65 if ground_truth == "pneumonia" else 0.29
    return _clamp(random.gauss(base, 0.14))


def generate_cases(n: int = 500) -> list[dict[str, Any]]:
    cases = []
    for i in range(n):
        sex = random.choice(SEXES)
        age_group = random.choices(AGE_GROUPS, weights=[0.25, 0.40, 0.35])[0]
        scanner = random.choice(SCANNERS)
        ground_truth = "pneumonia" if random.random() < 0.30 else "normal"

        cases.append({
            "case_id": f"case_{i+1:03d}",
            "ground_truth": ground_truth,
            "sex": sex,
            "age_group": age_group,
            "scanner": scanner,
            "predictions": {
                "chexnet": {"confidence": _chexnet_confidence(ground_truth, sex, age_group)},
                "biovil": {"confidence": _biovil_confidence(ground_truth, sex, age_group)},
                "vendor_x": {"confidence": _vendor_x_confidence(ground_truth, sex, age_group)},
            },
        })
    return cases


DEMO_CASES = generate_cases(500)
