import hashlib
import json
import os
from dataclasses import asdict
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from async_runner import QStashJobRunner
from memory_engine import memory_tool
from minds_integration import MindsConfigurationError, minds_manager
from creator_signals import calculate_signals
from youtube_analytics import AnalyticsImportError, MAX_CSV_BYTES, parse_content_csv, parse_date_csv

V2_PRODUCT_CSV_MAX_BYTES = min(MAX_CSV_BYTES, 2 * 1024 * 1024)

load_dotenv()
app = FastAPI(title="GreenRoom: Persistent Creator Decision Intelligence", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
qstash_runner = QStashJobRunner()


@app.exception_handler(MindsConfigurationError)
async def minds_config_exception_handler(_request, exc: MindsConfigurationError):
    return JSONResponse(status_code=500, content={"error": "MINDS_BUILDER_CONFIGURATION_ERROR", "message": str(exc)})


class PreferenceRequest(BaseModel):
    preference: str


class TriggerBriefingRequest(BaseModel):
    objective_id: str


class BriefingItemFeedbackRequest(BaseModel):
    item_id: str
    feedback_type: str
    notes: Optional[str] = None


class ObjectiveCreateRequest(BaseModel):
    title: str
    details: Optional[str] = ""


class OnboardingRequest(BaseModel):
    creator_name: Optional[str] = None
    niche: Optional[str] = None
    audience_description: Optional[str] = None
    brand_voice_attributes: Optional[List[str]] = None
    preferred_tone: Optional[str] = None
    main_goal: Optional[str] = None
    long_term_objective: Optional[str] = None
    content_wanted: Optional[List[str]] = None
    content_not_wanted: Optional[List[str]] = None


class AnalyticsFileRequest(BaseModel):
    filename: str
    mime_type: Optional[str] = None
    content: str


class AnalyticsImportRequest(BaseModel):
    content_report: AnalyticsFileRequest
    date_report: AnalyticsFileRequest


def _public_analytics(analytics):
    if not analytics:
        return None
    return {
        "platform": analytics.get("platform"),
        "imported_at": analytics.get("imported_at"),
        "content_hash": analytics.get("content_hash"),
        "reports": [{
            "report_type": item.get("granularity"),
            "filename": item.get("filename"),
            "row_count": item.get("row_count"),
            "recognized_columns": item.get("recognized_columns", []),
        } for item in analytics.get("imports", [])],
        "signals": [{
            key: signal.get(key) for key in (
                "signal_id", "type", "direction", "classification", "current_value",
                "comparison_value", "percentage_delta", "unit", "data_sufficiency", "uncertainty"
            )
        } for signal in analytics.get("signals", [])],
    }


@app.get("/api/state")
def get_state():
    state = memory_tool.reload_state()
    return {**state, "v2_analytics": _public_analytics(qstash_runner.store.get_v2_analytics())}


@app.post("/api/v2-analytics")
def import_v2_analytics(req: AnalyticsImportRequest):
    files = (req.content_report, req.date_report)
    for item in files:
        size = len(item.content.encode("utf-8"))
        if size > V2_PRODUCT_CSV_MAX_BYTES:
            raise HTTPException(status_code=413, detail="CSV exceeds the 2 MB file limit")
        if not os.path.basename(item.filename).lower().endswith(".csv"):
            raise HTTPException(status_code=422, detail="Only CSV files are supported")
        if item.mime_type and item.mime_type.lower() not in ("text/csv", "application/csv", "application/vnd.ms-excel"):
            raise HTTPException(status_code=422, detail="The selected file is not a supported CSV")
    try:
        content_import = parse_content_csv(req.content_report.content, os.path.basename(req.content_report.filename))
        date_import = parse_date_csv(req.date_report.content, os.path.basename(req.date_report.filename))
        signals = calculate_signals(content_import, date_import)
    except AnalyticsImportError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    imported_at = max(content_import.imported_at, date_import.imported_at)
    combined_hash = hashlib.sha256(
        f"{content_import.content_sha256}:{date_import.content_sha256}".encode("ascii")
    ).hexdigest()
    record = {
        "schema_version": "greenroom_v2_analytics_bundle_v1",
        "platform": "YOUTUBE",
        "imported_at": imported_at,
        "content_hash": combined_hash,
        "imports": [content_import.to_dict(), date_import.to_dict()],
        "signals": [asdict(signal) for signal in signals],
    }
    qstash_runner.store.save_v2_analytics(record)
    return {"status": "success", "analytics": _public_analytics(record)}


@app.get("/api/v2-analytics")
def get_v2_analytics():
    analytics = _public_analytics(qstash_runner.store.get_v2_analytics())
    if not analytics:
        raise HTTPException(status_code=404, detail="No YouTube Studio analytics import is available")
    return {"status": "success", "analytics": analytics}


@app.post("/api/memory/preferences")
def remember_preference(req: PreferenceRequest):
    try:
        result = memory_tool.remember_preference(req.preference)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not persist preference: {exc}") from exc
    return {"status": "success", **result, "persistence_mode": memory_tool.persistence_mode, "state": memory_tool.get_full_state()}


@app.get("/api/minds/status")
def get_minds_status():
    return minds_manager.get_status()


@app.get("/api/briefing/latest")
def get_latest_briefing():
    return {"status": "success", "briefing": memory_tool.get_latest_briefing(), "minds_status": minds_manager.get_status()}


@app.get("/api/briefing/run/{run_id}")
def get_run_briefing(run_id: str):
    status = qstash_runner.get_status(run_id)
    if status.get("status") != "COMPLETED":
        raise HTTPException(status_code=409, detail=f"Run {run_id} is not completed")
    briefing = qstash_runner.store.get_run_briefing(run_id)
    if not briefing:
        raise HTTPException(status_code=404, detail=f"Briefing for run {run_id} was not found")
    snapshot = status.get("objective_snapshot") or {}
    if briefing.get("run_id") != run_id:
        raise HTTPException(status_code=409, detail="Persisted briefing run ID does not match requested run")
    if briefing.get("objective_id") != snapshot.get("objective_id"):
        raise HTTPException(status_code=409, detail="Persisted briefing objective does not match queued run")
    if briefing.get("objective_snapshot", {}).get("fingerprint") != snapshot.get("fingerprint"):
        raise HTTPException(status_code=409, detail="Persisted briefing objective snapshot does not match queued run")
    return {"status": "success", "briefing": briefing, "objective_snapshot": snapshot}


@app.post("/api/briefing/trigger")
async def trigger_briefing(request: Request, req: TriggerBriefingRequest):
    state = memory_tool.reload_state()
    objective = next((item for item in state.get("creator_objectives", []) if item.get("id") == req.objective_id), None)
    if not objective:
        raise HTTPException(status_code=404, detail="Saved objective was not found in durable state")
    basis = {"objective_id": objective["id"], "title": objective["title"], "constraints": objective.get("details", "")}
    snapshot = {**basis, "fingerprint": hashlib.sha256(json.dumps(basis, sort_keys=True, separators=(",", ":")).encode()).hexdigest()}
    if os.getenv("DEMO_MODE", "").lower() not in ("true", "1"):
        missing = [name for name in ("QSTASH_TOKEN", "QSTASH_CURRENT_SIGNING_KEY", "QSTASH_NEXT_SIGNING_KEY") if not os.getenv(name)]
        if qstash_runner.store.mode_label != "DURABLE":
            missing.append("UPSTASH_REDIS_REST_URL/TOKEN")
        if missing:
            raise HTTPException(status_code=503, detail=f"Production background execution is not fully configured. Missing: {', '.join(missing)}")
    host = request.headers.get("host", "localhost:8000")
    scheme = "https" if request.url.scheme == "https" or "vercel.app" in host else "http"
    result = await qstash_runner.enqueue_run(f"{scheme}://{host}/api/briefing-worker", snapshot)
    return {"status": "success", "run_id": result["run_id"], "job_status": result.get("status", "QUEUED"), "execution_mode": result.get("execution_mode", "QUEUED"), "qstash_published": result.get("qstash_published", False), "objective": snapshot, "minds_status": minds_manager.get_status()}


@app.get("/api/briefing/status")
def get_briefing_status(run_id: Optional[str] = None):
    if not run_id:
        latest = memory_tool.get_latest_briefing()
        run_id = latest.get("run_id") if latest else "latest"
    return qstash_runner.get_status(run_id)


@app.get("/api/briefing/recent")
def get_recent_briefing_runs():
    fields = ("run_id", "status", "queued_at", "started_at", "completed_at", "objective_id", "objective_fingerprint")
    return {"status": "success", "runs": [{field: item.get(field) for field in fields} for item in qstash_runner.store.get_recent_runs()[:20]]}


@app.post("/api/briefing/feedback")
def submit_briefing_feedback(req: BriefingItemFeedbackRequest):
    entry = memory_tool.add_item_feedback(req.item_id, req.feedback_type, req.notes)
    return {"status": "success", "feedback_entry": entry, "state": memory_tool.get_full_state()}


@app.post("/api/objective/create")
def create_objective(req: ObjectiveCreateRequest):
    entry = memory_tool.add_objective(req.title, req.details or "")
    return {"status": "success", "objective": entry, "state": memory_tool.get_full_state()}


@app.get("/api/objective/list")
def list_objectives():
    return {"status": "success", "objectives": memory_tool.get_objectives()}


@app.post("/api/creator/onboard")
def onboard_creator(req: OnboardingRequest):
    state = memory_tool.onboard_creator(req.dict(exclude_none=True))
    return {"status": "success", "message": "Creator profile persisted", "state": state, "minds_status": minds_manager.get_status()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
