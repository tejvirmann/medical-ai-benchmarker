import asyncio
import uuid
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from schema import BenchmarkRequest, BenchmarkRun, BenchmarkStatus
from runner import runs, run_benchmark
from report import generate_pdf

app = FastAPI(title="MedBench API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/benchmark", status_code=201)
async def create_benchmark(request: BenchmarkRequest, background_tasks: BackgroundTasks):
    run_id = str(uuid.uuid4())[:8]
    selected_models = []
    if request.models.chexnet:
        selected_models.append("chexnet")
    if request.models.biovil:
        selected_models.append("biovil")
    if request.models.vendor_x:
        selected_models.append("vendor_x")

    run = BenchmarkRun(
        id=run_id,
        status=BenchmarkStatus.pending,
        progress=0,
        progress_by_model={m: 0 for m in selected_models},
        request=request,
        created_at=datetime.now().isoformat(),
    )
    runs[run_id] = run
    background_tasks.add_task(run_benchmark, run_id)
    return {"id": run_id, "status": run.status}


@app.get("/benchmark/{run_id}")
async def get_benchmark(run_id: str):
    run = runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Benchmark run not found")
    return {
        "id": run.id,
        "status": run.status,
        "progress": run.progress,
        "progress_by_model": run.progress_by_model,
        "n_cases": run.n_cases,
        "created_at": run.created_at,
    }


@app.get("/benchmark/{run_id}/results")
async def get_results(run_id: str):
    run = runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Benchmark run not found")
    if run.status != BenchmarkStatus.complete:
        raise HTTPException(status_code=202, detail="Benchmark not yet complete")
    return {
        "id": run.id,
        "status": run.status,
        "n_cases": run.n_cases,
        "summary": run.summary,
        "results": [r.model_dump() for r in (run.results or [])],
    }


@app.get("/benchmark/{run_id}/report")
async def get_report(run_id: str):
    run = runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Benchmark run not found")
    if run.status != BenchmarkStatus.complete:
        raise HTTPException(status_code=202, detail="Benchmark not yet complete")
    pdf_bytes = generate_pdf(run)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=medbench-report-{run_id}.pdf"},
    )


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
