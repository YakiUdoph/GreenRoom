import asyncio
import json
import os
from typing import Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from memory_engine import memory_tool
from imp_protocol import imp_bus, IMPMessage
from agents import GreenroomCoreMind, ScoutMind, CommunityMind, BusinessMind
from demo_runner import demo_runner_tool

app = FastAPI(title="Greenroom: Persistent Multi-Mind Creator Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        "memory_state": memory_tool.get_full_state()
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


# REST Endpoints
@app.get("/api/state")
def get_state():
    return memory_tool.get_full_state()

@app.get("/api/imp/history")
def get_imp_history(limit: int = 50):
    return imp_bus.get_history(limit=limit)

@app.post("/api/demo/reset")
def reset_state():
    imp_bus.clear()
    state = memory_tool.reset_state()
    return {"status": "success", "message": "State reset to zero-state", "state": state}

@app.post("/api/demo/step/{step_id}")
async def run_demo_step(step_id: int, request: Optional[FeedbackRequest] = None):
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
    
    return {"status": "success", "step_result": res, "state": memory_tool.get_full_state()}

@app.post("/api/demo/full")
async def run_full_demo():
    results = await demo_runner_tool.run_full_demo()
    return {"status": "success", "results": results, "state": memory_tool.get_full_state()}

@app.post("/api/action/feedback")
async def process_feedback(req: FeedbackRequest):
    res = await demo_runner_tool.run_minute_5(custom_feedback=req.feedback)
    return {"status": "success", "result": res, "state": memory_tool.get_full_state()}

@app.post("/api/action/approve")
async def approve_action(payload: Dict[str, Any]):
    action_name = payload.get("action_name", "Sponsorship Outreach")
    msg = await imp_bus.publish(IMPMessage(
        sender_mind="User",
        target_mind="GreenroomCore",
        action_type="APPROVAL_CONFIRMED",
        confidence_score=1.00,
        payload={"action_name": action_name, "status": "APPROVED", "timestamp": os.getenv("CURRENT_TIME", "")}
    ))
    return {"status": "success", "approval": action_name, "message": msg.to_dict()}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial snapshot
        await websocket.send_json({
            "type": "INITIAL_SNAPSHOT",
            "imp_history": imp_bus.get_history(limit=20),
            "memory_state": memory_tool.get_full_state()
        })
        while True:
            data = await websocket.receive_text()
            # Handle incoming WebSocket commands if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Mount static frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
