import asyncio
import time
import json
import os
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
        self.status = "IDLE"  # IDLE, RUNNING, COMPLETED, FAILED
        self.last_run_timestamp: Optional[float] = None
        self.last_run_iso: Optional[str] = None
        self.current_task: Optional[asyncio.Task] = None
        self.error_message: Optional[str] = None
        self.signals_reviewed_count = 0
        self.opportunities_found_count = 0
        self.memory_nodes_used_count = 0

    def get_status(self) -> Dict[str, Any]:
        return {
            "status": self.status,
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
        If accelerated=True, executes synchronously or in background with minimal delay suitable for a live demo.
        """
        if self.status == "RUNNING":
            return {"status": "RUNNING", "message": "An autonomous cycle is already in progress."}

        self.status = "RUNNING"
        self.error_message = None
        now_ts = time.time()
        self.last_run_timestamp = now_ts
        self.last_run_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        try:
            if accelerated:
                # Synchronous / immediate completion for accelerated hackathon demo
                briefing = await core_mind.run_autonomous_cycle()
                self.status = "COMPLETED"
                self.signals_reviewed_count = briefing.get("signals_reviewed_count", 3)
                self.opportunities_found_count = briefing.get("opportunities_found_count", len(briefing.get("items", [])))
                self.memory_nodes_used_count = briefing.get("memory_nodes_used_count", 2)
                return {
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
                        self.signals_reviewed_count = briefing.get("signals_reviewed_count", 3)
                        self.opportunities_found_count = briefing.get("opportunities_found_count", len(briefing.get("items", [])))
                        self.memory_nodes_used_count = briefing.get("memory_nodes_used_count", 2)
                    except Exception as exc:
                        self.status = "FAILED"
                        self.error_message = str(exc)

                self.current_task = asyncio.create_task(_background_work())
                return {
                    "status": "RUNNING",
                    "message": "Autonomous background cycle launched."
                }
        except Exception as e:
            self.status = "FAILED"
            self.error_message = str(e)
            raise e

async_runner = AsyncJobRunner()
