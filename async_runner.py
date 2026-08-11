import os
import json
import uuid
import datetime
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from persistence import get_persistence_store, PersistenceStore

def publish_qstash_job(target_url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Publishes a background execution job to Upstash QStash REST API.
    Reads QSTASH_URL or automatically retries regional QStash hosts if region mismatch occurs.
    """
    token = os.getenv("QSTASH_TOKEN")
    if not token:
        return {"published": False, "reason": "QSTASH_TOKEN environment variable not set"}

    import http.client
    from urllib.parse import urlparse

    if not target_url.startswith("http"):
        target_url = f"https://{target_url}"

    env_url = os.getenv("QSTASH_URL", "")
    primary_host = urlparse(env_url).netloc if env_url else "qstash.upstash.io"

    candidate_hosts = [primary_host]
    for fallback in ["qstash-us-east-1.upstash.io", "qstash-us-west-1.upstash.io", "qstash-eu-west-1.upstash.io", "qstash.upstash.io"]:
        if fallback not in candidate_hosts:
            candidate_hosts.append(fallback)

    path = f"/v2/publish/{target_url}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Upstash-Retries": "2"
    }

    last_error = ""
    for host in candidate_hosts:
        try:
            conn = http.client.HTTPSConnection(host, timeout=10)
            conn.request("POST", path, body=json.dumps(payload), headers=headers)
            resp = conn.getresponse()
            resp_body = resp.read().decode("utf-8")
            conn.close()

            if resp.status in (200, 201, 202):
                res_data = json.loads(resp_body) if resp_body else {}
                return {"published": True, "messageId": res_data.get("messageId"), "host": host}
            
            last_error = f"QStash HTTP {resp.status} on {host}: {resp_body}"
            # If error is not a region mismatch 404, don't try other regions
            if resp.status != 404 or "not found in this region" not in resp_body:
                break
        except Exception as e:
            last_error = f"Connection error on {host}: {e}"

    return {"published": False, "reason": last_error}




class QStashJobRunner:
    """
    QStash-backed Genuine Async Job Runner for Greenroom.
    Manages QUEUED -> RUNNING -> COMPLETED / FAILED lifecycle durably in PersistenceStore.
    """
    def __init__(self, store: Optional[PersistenceStore] = None):
        self.store = store or get_persistence_store()

    def get_status(self, run_id: str) -> Dict[str, Any]:
        """Reads run status directly from durable PersistenceStore (never in-process memory)."""
        stored = self.store.get_run_status(run_id)
        if stored:
            return stored
        return {
            "run_id": run_id,
            "status": "NOT_FOUND",
            "error": "Run ID not found in persistence store"
        }

    def save_status(self, run_id: str, status: str, **kwargs) -> Dict[str, Any]:
        existing = self.store.get_run_status(run_id) or {}
        existing["run_id"] = run_id
        existing["status"] = status
        for k, v in kwargs.items():
            existing[k] = v
        self.store.save_run_status(run_id, existing)
        return existing

    async def enqueue_run(self, worker_target_url: str, run_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Creates run_id, persists status = QUEUED, publishes job to QStash,
        and returns IMMEDIATELY without invoking agent execution in Python process.
        """
        rid = run_id or f"run_{uuid.uuid4().hex[:8]}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        status_data = self.save_status(
            rid,
            status="QUEUED",
            queued_at=now_iso,
            started_at=None,
            completed_at=None,
            error=None
        )

        payload = {"run_id": rid, "queued_at": now_iso}

        token = os.getenv("QSTASH_TOKEN")
        if token:
            qstash_res = publish_qstash_job(worker_target_url, payload)
            if not qstash_res.get("published"):
                err_msg = f"QStash publish failed: {qstash_res.get('reason')}"
                self.save_status(rid, status="FAILED", error=err_msg)
                return {
                    "run_id": rid,
                    "status": "FAILED",
                    "queued_at": now_iso,
                    "execution_mode": "QSTASH_BACKGROUND_JOB",
                    "qstash_published": False,
                    "error": err_msg
                }

            return {
                "run_id": rid,
                "status": "QUEUED",
                "queued_at": now_iso,
                "execution_mode": "QSTASH_BACKGROUND_JOB",
                "qstash_published": True,
                "message": "Autonomous job queued to QStash."
            }

        # Local testing mode without QSTASH_TOKEN
        return {
            "run_id": rid,
            "status": "QUEUED",
            "queued_at": now_iso,
            "execution_mode": "LOCAL_ASYNC_QUEUE",
            "qstash_published": False,
            "message": "Autonomous job queued locally."
        }


    async def execute_worker_job(self, core_mind, run_id: str) -> Dict[str, Any]:
        """
        Invoked by the worker endpoint (/api/briefing/worker).
        Transitions status: QUEUED -> RUNNING -> COMPLETED or FAILED durably.
        """
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.save_status(run_id, status="RUNNING", started_at=now_iso)

        try:
            briefing = await core_mind.run_autonomous_cycle()
            completed_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            
            # Update provenance execution_mode
            if isinstance(briefing, dict):
                briefing.setdefault("provenance", {})["execution_mode"] = "QSTASH_BACKGROUND_JOB"
                briefing.setdefault("provenance", {})["run_id"] = run_id
                briefing["run_id"] = run_id
                self.store.save_briefing(briefing)

            status_data = self.save_status(
                run_id,
                status="COMPLETED",
                completed_at=completed_iso,
                briefing_id=briefing.get("run_id", run_id),
                provenance=briefing.get("provenance", {})
            )
            return status_data

        except Exception as e:
            failed_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            status_data = self.save_status(
                run_id,
                status="FAILED",
                completed_at=failed_iso,
                error=str(e)
            )
            return status_data
