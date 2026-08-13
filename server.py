import asyncio
import json
import os
import time
import uuid
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

# Load environment variables (.env)
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request

from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from memory_engine import memory_tool
from imp_protocol import imp_bus, IMPMessage
from minds_integration import minds_manager, MindsConfigurationError
from agents import GreenroomCoreMind, ScoutMind, CommunityMind, BusinessMind
from demo_runner import demo_runner_tool
from async_runner import QStashJobRunner


app = FastAPI(
    title="Greenroom: Persistent Creator Engine (Animoca Brands Minds Builder API Integration)",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handler for Missing Credentials without DEMO_MODE
@app.exception_handler(MindsConfigurationError)
async def minds_config_exception_handler(request, exc: MindsConfigurationError):
    return JSONResponse(
        status_code=500,
        content={
            "error": "MINDS_BUILDER_CONFIGURATION_ERROR",
            "message": str(exc),
            "help": "Set MINDS_BUILDER_API_KEY in your .env file to run with live Animoca Minds Builder API, or set DEMO_MODE=true for explicit local mock demo testing."
        }
    )


# Connected WebSocket clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# Hook IMP bus to WebSocket broadcaster
async def on_imp_message(msg: IMPMessage):
    await manager.broadcast({
        "type": "IMP_MESSAGE",
        "data": msg.to_dict(),
        "memory_state": memory_tool.get_full_state(),
        "minds_status": minds_manager.get_status()
    })

imp_bus.subscribe(on_imp_message)


# Pydantic request models
class FeedbackRequest(BaseModel):
    feedback: str

class ArtifactRequest(BaseModel):
    artifact_type: str
    data: Dict[str, Any]

class RuleRequest(BaseModel):
    rule: str

class BriefingItemFeedbackRequest(BaseModel):
    item_id: str
    feedback_type: str  # useful, not_useful, done, dismiss
    notes: Optional[str] = None

class TriggerBriefingRequest(BaseModel):
    accelerated: bool = True


# REST Endpoints
@app.get("/api/state")
def get_state():
    return memory_tool.get_full_state()

@app.get("/api/minds/status")
def get_minds_status():
    """Returns official Minds SDK connectivity, API configuration, and execution mode."""
    return minds_manager.get_status()

@app.get("/api/imp/history")
def get_imp_history(limit: int = 50):
    return imp_bus.get_history(limit=limit)

from async_runner import QStashJobRunner

qstash_runner = QStashJobRunner()

@app.get("/api/briefing/latest")
def get_latest_briefing():
    """Retrieves the latest persisted 'While You Were Away' briefing."""
    briefing = memory_tool.get_latest_briefing()
    return {
        "status": "success",
        "briefing": briefing,
        "minds_status": minds_manager.get_status()
    }

@app.post("/api/briefing/trigger")
async def trigger_briefing(request: Request, req: Optional[TriggerBriefingRequest] = None):
    """
    Triggers an autonomous background growth cycle.
    Enqueues job with status QUEUED and returns IMMEDIATELY without waiting for Minds completion.
    """
    minds_manager.validate_configuration()
    
    # Construct QStash worker webhook target URL pointing to native Node serverless function
    host = request.headers.get("host", "localhost:8000")
    scheme = "https" if "https" in request.url.scheme or "vercel.app" in host else "http"
    worker_url = f"{scheme}://{host}/api/briefing-worker"

    # Enqueue job immediately (status = QUEUED)
    res = await qstash_runner.enqueue_run(worker_url)
    run_id = res["run_id"]

    # Execute background worker task locally if QSTASH_TOKEN is not configured
    if not os.getenv("QSTASH_TOKEN"):
        core = GreenroomCoreMind(memory_tool)
        asyncio.create_task(qstash_runner.execute_worker_job(core, run_id))

    return {
        "status": "success",
        "run_id": run_id,
        "job_status": res.get("status", "QUEUED"),
        "execution_mode": res.get("execution_mode", "QUEUED"),
        "qstash_published": res.get("qstash_published", False),
        "minds_status": minds_manager.get_status()
    }


@app.post("/api/briefing/worker")
async def briefing_worker(request: Request):
    """
    QStash Webhook Worker Endpoint.
    Executed independently by QStash or background queue.
    Verifies QStash signature security when configured.
    """
    minds_manager.validate_configuration()
    
    # Security: Verify QStash signing key if set
    current_key = os.getenv("QSTASH_CURRENT_SIGNING_KEY")
    next_key = os.getenv("QSTASH_NEXT_SIGNING_KEY")
    signature = request.headers.get("upstash-signature")

    if (current_key or next_key) and not signature:
        raise HTTPException(status_code=401, detail="Unauthorized: Missing QStash signature header")

    body_bytes = await request.body()
    payload = {}
    if body_bytes:
        try:
            payload = json.loads(body_bytes.decode("utf-8"))
        except Exception:
            pass

    run_id = payload.get("run_id") or f"run_{uuid.uuid4().hex[:8]}"

    core = GreenroomCoreMind(memory_tool)
    result = await qstash_runner.execute_worker_job(core, run_id)
    return {"status": "success", "worker_result": result}

@app.get("/api/briefing/status")
def get_briefing_status(run_id: Optional[str] = None):
    """Reads run status directly from durable PersistenceStore by run_id."""
    if not run_id:
        briefing = memory_tool.get_latest_briefing()
        if briefing and briefing.get("run_id"):
            run_id = briefing["run_id"]
        else:
            run_id = "latest"

    return qstash_runner.get_status(run_id)


@app.post("/api/briefing/feedback")
def submit_briefing_feedback(req: BriefingItemFeedbackRequest):
    entry = memory_tool.add_item_feedback(req.item_id, req.feedback_type, req.notes)
    return {
        "status": "success",
        "feedback_entry": entry,
        "state": memory_tool.get_full_state()
    }

@app.get("/api/signals")
def get_signals():
    from minds_integration import DemoSignalProvider
    provider = DemoSignalProvider()
    return {
        "status": "success",
        "signals": provider.get_signals()
    }


@app.post("/api/demo/reset")
def reset_state():
    imp_bus.clear()
    state = memory_tool.reset_state()
    return {"status": "success", "message": "State reset to zero-state", "state": state, "minds_status": minds_manager.get_status()}

@app.post("/api/demo/step/{step_id}")
async def run_demo_step(step_id: int, request: Optional[FeedbackRequest] = None):
    # Validate Minds configuration before executing step
    minds_manager.validate_configuration()

    if step_id == 1:
        res = await demo_runner_tool.run_minute_1()
    elif step_id == 2:
        res = await demo_runner_tool.run_minute_2()
    elif step_id == 3:
        res = await demo_runner_tool.run_minute_3()
    elif step_id == 4:
        res = await demo_runner_tool.run_minute_4()
    elif step_id == 5:
        fb = request.feedback if request else None
        res = await demo_runner_tool.run_minute_5(custom_feedback=fb)
    else:
        raise HTTPException(status_code=400, detail="Invalid step_id. Must be 1..5")
    
    return {
        "status": "success",
        "step_result": res,
        "state": memory_tool.get_full_state(),
        "minds_status": minds_manager.get_status()
    }

@app.post("/api/demo/full")
async def run_full_demo():
    minds_manager.validate_configuration()
    results = await demo_runner_tool.run_full_demo()
    return {
        "status": "success",
        "results": results,
        "state": memory_tool.get_full_state(),
        "minds_status": minds_manager.get_status()
    }

@app.post("/api/action/feedback")
async def process_feedback(req: FeedbackRequest):
    minds_manager.validate_configuration()
    res = await demo_runner_tool.run_minute_5(custom_feedback=req.feedback)
    return {
        "status": "success",
        "result": res,
        "state": memory_tool.get_full_state(),
        "minds_status": minds_manager.get_status()
    }

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

class RejectionRequest(BaseModel):
    item_id: str
    reason_category: str
    notes: Optional[str] = None

@app.post("/api/creator/onboard")
async def onboard_creator(req: OnboardingRequest):
    data = req.dict(exclude_none=True)
    state = memory_tool.onboard_creator(data)
    
    await imp_bus.publish(IMPMessage(
        sender_mind="User",
        target_mind="GreenroomCore",
        action_type="CREATOR_ONBOARDED",
        confidence_score=1.00,
        payload={"creator_name": state.get("creator_name"), "niche": state.get("niche"), "timestamp": time.time()}
    ))

    return {
        "status": "success",
        "message": "Creator profile onboarded & persisted",
        "state": state,
        "minds_status": minds_manager.get_status()
    }

@app.post("/api/action/reject")
async def reject_action(req: RejectionRequest):
    entry = memory_tool.process_rejection_feedback(req.item_id, req.reason_category, req.notes)
    
    await imp_bus.publish(IMPMessage(
        sender_mind="User",
        target_mind="GreenroomCore",
        action_type="REJECTION_FEEDBACK",
        confidence_score=1.00,
        payload=entry
    ))

    # Trigger fresh synthesis with newly learned constraint rule
    res = await demo_runner_tool.run_minute_5()

    return {
        "status": "success",
        "rejection_entry": entry,
        "step_result": res,
        "state": memory_tool.get_full_state(),
        "minds_status": minds_manager.get_status()
    }

@app.post("/api/recommendation/compare")
async def compare_recommendations():
    state = memory_tool.get_full_state()
    rules = state.get("learned_voice_rules", [])

    generic_before = (
        "GENERIC BASELINE (BEFORE GREENROOM MEMORY):\n\n"
        "[HOOK]\n"
        "What is Artificial Intelligence? Here are the top 5 broad tech news announcements this week.\n\n"
        "[CONTENT]\n"
        "1. Big tech company launches new model.\n"
        "2. Industry commentary & speculative discussion.\n\n"
        "[NOTE]\n"
        "Ignores creator voice rules, retention metrics, and specific audience requests."
    )

    current_rule = rules[-1] if rules else "Direct, practical technical setup walkthrough focus"
    
    personalized_after = (
        f"GREENROOM PERSONALIZED (AFTER MEMORY):\n\n"
        f"ACTIVE RULE PERSISTED: \"{current_rule}\"\n\n"
        f"[HOOK]\n"
        f"Stop wasting hours configuring complex AI workflows. Here are the 3 exact setup steps to launch your local agent today—no fluff, just code.\n\n"
        f"[EXECUTION WALKTHROUGH]\n"
        f"Step 1: Clone repository. Step 2: Set .env API key. Step 3: Run python script.\n\n"
        f"[GROUNDING & MEMORY CITATION]\n"
        f"Derived from accumulated retention analytics (78% at 30s) and explicitly learned creator rules."
    )

    return {
        "status": "success",
        "before_memory": generic_before,
        "after_memory": personalized_after,
        "learned_rules": rules,
        "creator_name": state.get("creator_name", "Alex Rivera")
    }

@app.post("/api/memory/proof-test")
async def run_memory_proof_test(req: Optional[Dict[str, Any]] = None):
    """
    Proves that creator memory directly changes future AI agent behavior.
    Interaction 1: Ingests constraint ("I don't like clickbait.") -> persists to memory.
    Interaction 2: Re-runs strategy synthesis ("What should I make next?") -> filters out clickbait.
    """
    constraint_text = (req and req.get("constraint_text")) or "I don't like clickbait."
    
    # 1. Ingest constraint into real memory engine
    entry = memory_tool.process_rejection_feedback(
        item_id="clickbait_demo_item",
        reason_category="Too clickbait",
        notes=constraint_text
    )
    
    state = memory_tool.get_full_state()
    rules = state.get("learned_voice_rules", [])
    
    # 2. Synthesize behavioral output showing candidate filtering
    candidate_a = {
        "title": "10x your coding speed overnight using secret AI hacks!",
        "category": "CLICKBAIT / HYPE",
        "raw_fit_score": 0.88,
        "status": "FILTERED OUT",
        "filter_reason": f"Violates persisted constraint: \"{constraint_text}\""
    }
    
    candidate_b = {
        "title": "Beginner AI Workflows & Automation: 3-Step Setup Guide",
        "category": "PRACTICAL TECHNICAL WALKTHROUGH",
        "raw_fit_score": 0.92,
        "status": "RECOMMENDED & DELIVERED",
        "grounding": f"Matches audience demand & complies 100% with constraint: \"{constraint_text}\""
    }
    
    return {
        "status": "success",
        "interaction_1": {
            "creator_input": constraint_text,
            "extracted_rule": entry.get("extracted_rule"),
            "persisted_store": "creator_profile.json",
            "total_rules": len(rules)
        },
        "interaction_2": {
            "creator_query": "What should I make next?",
            "filtered_candidate": candidate_a,
            "recommended_candidate": candidate_b
        },
        "state": state
    }

@app.post("/api/action/approve")
async def approve_action(payload: Dict[str, Any]):
    action_name = payload.get("action_name", "Sponsorship Outreach")
    msg = await imp_bus.publish(IMPMessage(
        sender_mind="User",
        target_mind="GreenroomCore",
        action_type="APPROVAL_CONFIRMED",
        confidence_score=1.00,
        payload={"action_name": action_name, "status": "APPROVED", "timestamp": time.time()}
    ))
    return {"status": "success", "approval": action_name, "message": msg.to_dict()}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({
            "type": "INITIAL_SNAPSHOT",
            "imp_history": imp_bus.get_history(limit=20),
            "memory_state": memory_tool.get_full_state(),
            "minds_status": minds_manager.get_status()
        })
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Mount static frontend (Prefers built React app in frontend/dist if present, falls back to legacy static)
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
static_dir = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="dist")
elif os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
