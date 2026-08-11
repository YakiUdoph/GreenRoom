import asyncio
import time
import json
import os
import uuid
import datetime
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class AsyncJobRunner:
    """
    Server-side Async Job Runner for Greenroom Autonomous Growth Cycles.
    Orchestrates background signal monitoring, agent analysis, opportunity ranking,
    and briefing persistence without requiring continuous browser presence.
    """
    def __init__(self):
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.latest_run_id: Optional[str] = None
        self.status = "IDLE"  # IDLE, RUNNING, COMPLETED, FAILED
        self.last_run_timestamp: Optional[float] = None
        self.last_run_iso: Optional[str] = None
        self.current_task: Optional[asyncio.Task] = None
        self.error_message: Optional[str] = None
        self.signals_reviewed_count = 0
        self.opportunities_found_count = 0
        self.memory_nodes_used_count = 0

    def get_status(self, run_id: Optional[str] = None) -> Dict[str, Any]:
        target_id = run_id or self.latest_run_id
        if target_id and target_id in self.jobs:
            return self.jobs[target_id]

        return {
            "status": self.status,
            "run_id": target_id or "idle",
            "last_run_timestamp": self.last_run_timestamp,
            "last_run_iso": self.last_run_iso,
            "signals_reviewed": self.signals_reviewed_count,
            "opportunities_found": self.opportunities_found_count,
            "memory_nodes_used": self.memory_nodes_used_count,
            "error": self.error_message
        }

    async def trigger_autonomous_run(self, core_mind, accelerated: bool = True) -> Dict[str, Any]:
        """
        Triggers an autonomous background analysis cycle.
        Returns job metadata and status without requiring browser to remain connected.
        """
        run_id = f"run_{uuid.uuid4().hex[:8]}"
        self.latest_run_id = run_id
        self.status = "RUNNING"
        self.error_message = None
        now_ts = time.time()
        self.last_run_timestamp = now_ts
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.last_run_iso = now_iso

        job_info = {
            "run_id": run_id,
            "status": "RUNNING",
            "started_at": now_iso,
            "completed_at": None,
            "error": None
        }
        self.jobs[run_id] = job_info

        try:
            if accelerated:
                # Synchronous / immediate completion for accelerated hackathon demo
                briefing = await core_mind.run_autonomous_cycle()
                self.status = "COMPLETED"
                job_info["status"] = "COMPLETED"
                job_info["completed_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                job_info["briefing"] = briefing
                self.signals_reviewed_count = briefing.get("signals_reviewed_count", 3)
                self.opportunities_found_count = briefing.get("opportunities_found_count", len(briefing.get("items", [])))
                self.memory_nodes_used_count = briefing.get("memory_nodes_used_count", 2)
                return {
                    "run_id": run_id,
                    "status": "COMPLETED",
                    "message": "Autonomous analysis cycle finished.",
                    "briefing": briefing
                }
            else:
                # Background task execution
                async def _background_work():
                    try:
                        briefing = await core_mind.run_autonomous_cycle()
                        self.status = "COMPLETED"
                        job_info["status"] = "COMPLETED"
                        job_info["completed_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                        job_info["briefing"] = briefing
                        self.signals_reviewed_count = briefing.get("signals_reviewed_count", 3)
                        self.opportunities_found_count = briefing.get("opportunities_found_count", len(briefing.get("items", [])))
                        self.memory_nodes_used_count = briefing.get("memory_nodes_used_count", 2)
                    except Exception as exc:
                        self.status = "FAILED"
                        job_info["status"] = "FAILED"
                        job_info["error"] = str(exc)
                        self.error_message = str(exc)

                self.current_task = asyncio.create_task(_background_work())
                return {
                    "run_id": run_id,
                    "status": "RUNNING",
                    "message": "Autonomous background cycle launched."
                }
        except Exception as e:
            self.status = "FAILED"
            job_info["status"] = "FAILED"
            job_info["error"] = str(e)
            self.error_message = str(e)
            raise e

async_runner = AsyncJobRunner()
