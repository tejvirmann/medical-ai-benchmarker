from pydantic import BaseModel
from typing import Optional
from enum import Enum


class Modality(str, Enum):
    chest_xray = "chest_xray"
    ct = "ct"
    mri = "mri"
    pathology = "pathology"


class Task(str, Enum):
    pneumonia_detection = "pneumonia_detection"
    nodule_detection = "nodule_detection"
    fracture_detection = "fracture_detection"


class Population(str, Enum):
    adult_icu = "adult_icu"
    general_adult = "general_adult"
    pediatric = "pediatric"


class BenchmarkStatus(str, Enum):
    pending = "pending"
    running = "running"
    complete = "complete"
    failed = "failed"


class ModelSelection(BaseModel):
    chexnet: bool = True
    biovil: bool = True
    vendor_x: bool = True


class BenchmarkRequest(BaseModel):
    modality: Modality = Modality.chest_xray
    task: Task = Task.pneumonia_detection
    population: Population = Population.adult_icu
    models: ModelSelection = ModelSelection()
    use_demo_data: bool = True


class SubgroupResult(BaseModel):
    group_name: str
    group_value: str
    n: int
    auc: float
    sensitivity: float
    specificity: float


class ModelResult(BaseModel):
    model_id: str
    model_name: str
    model_source: str
    auc: float
    sensitivity: float
    specificity: float
    bias_flagged: bool
    bias_description: Optional[str]
    subgroups: list[SubgroupResult]
    latency_ms: float


class BenchmarkRun(BaseModel):
    id: str
    status: BenchmarkStatus
    progress: int  # 0-100
    progress_by_model: dict[str, int]
    request: BenchmarkRequest
    results: Optional[list[ModelResult]] = None
    summary: Optional[str] = None
    n_cases: int = 0
    created_at: str
