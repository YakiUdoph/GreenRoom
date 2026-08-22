import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from async_runner import QStashJobRunner
from memory_engine import GreenroomMemoryEngine
from persistence import LocalFileStore


def snapshot(objective_id, title, constraints):
    return {
        "objective_id": objective_id,
        "title": title,
        "constraints": constraints,
        "fingerprint": f"fingerprint-{objective_id}",
    }


class RecordingCore:
    def __init__(self):
        self.calls = []

    async def run_autonomous_cycle(self, objective_snapshot=None, run_id=None):
        self.calls.append((run_id, dict(objective_snapshot)))
        return {
            "run_id": run_id,
            "objective_id": objective_snapshot["objective_id"],
            "items": [{"id": run_id, "title": objective_snapshot["title"]}],
            "provenance": {},
        }


class FailingCore:
    def __init__(self):
        self.calls = 0

    async def run_autonomous_cycle(self, objective_snapshot=None, run_id=None):
        self.calls += 1
        raise ValueError("Animoca Mind briefing response was HTML/XML-like, not JSON")


class ObjectiveBoundRunTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        directory = Path(self.temp.name)
        self.store = LocalFileStore(
            str(directory / "creator_profile.json"),
            str(directory / "latest_briefing.json"),
        )
        self.runner = QStashJobRunner(self.store)

    async def asyncTearDown(self):
        self.temp.cleanup()

    async def enqueue_local(self, objective):
        with patch.dict(os.environ, {"QSTASH_TOKEN": ""}):
            return await self.runner.enqueue_run("https://worker.test", objective)

    async def test_two_objectives_create_distinct_jobs_and_exact_qstash_payloads(self):
        objective_a = snapshot("obj_a", "Find paid AI sponsors", "No exposure-only campaigns")
        objective_b = snapshot("obj_b", "Find Web3 partnerships", "Require disclosed creator compensation")
        published = []

        def capture(_url, payload):
            published.append(payload)
            return {"published": True, "messageId": f"msg-{len(published)}"}

        with patch.dict(os.environ, {"QSTASH_TOKEN": "test-token"}), patch(
            "async_runner.publish_qstash_job", side_effect=capture
        ):
            job_a = await self.runner.enqueue_run("https://worker.test", objective_a)
            job_b = await self.runner.enqueue_run("https://worker.test", objective_b)

        self.assertNotEqual(job_a["run_id"], job_b["run_id"])
        self.assertEqual(objective_a, published[0]["objective"])
        self.assertEqual(objective_b, published[1]["objective"])
        self.assertEqual(objective_b, self.runner.get_status(job_b["run_id"])["objective_snapshot"])

    async def test_worker_uses_snapshot_b_and_delivery_cannot_return_a(self):
        objective_a = snapshot("obj_a", "Objective A result", "Constraint A")
        objective_b = snapshot("obj_b", "Objective B result", "Constraint B")
        job_a = await self.enqueue_local(objective_a)
        job_b = await self.enqueue_local(objective_b)
        core = RecordingCore()

        await self.runner.execute_worker_job(core, job_a["run_id"])
        await self.runner.execute_worker_job(core, job_b["run_id"])
        # Simulate latest moving back to A; B's authoritative record must not change.
        self.store.save_briefing(self.store.get_run_briefing(job_a["run_id"]))
        delivered_b = self.store.get_run_briefing(job_b["run_id"])

        self.assertEqual(objective_b, core.calls[1][1])
        self.assertEqual("obj_b", delivered_b["objective_id"])
        self.assertEqual("Objective B result", delivered_b["items"][0]["title"])
        self.assertEqual("obj_a", self.store.get_latest_briefing()["objective_id"])

    async def test_duplicate_delivery_is_idempotent(self):
        objective = snapshot("obj_once", "Run once", "Do not duplicate")
        job = await self.enqueue_local(objective)
        core = RecordingCore()

        first = await self.runner.execute_worker_job(core, job["run_id"])
        second = await self.runner.execute_worker_job(core, job["run_id"])

        self.assertEqual("COMPLETED", first["status"])
        self.assertTrue(second["idempotent_replay"])
        self.assertEqual(1, len(core.calls))

    async def test_sequential_stale_engines_preserve_both_objectives(self):
        first = GreenroomMemoryEngine(self.store)
        stale_second = GreenroomMemoryEngine(LocalFileStore(
            self.store.profile_path,
            self.store.briefing_path,
        ))

        objective_a = first.add_objective("Objective A", "Constraint A")
        objective_b = stale_second.add_objective("Objective B", "Constraint B")
        reloaded = GreenroomMemoryEngine(LocalFileStore(
            self.store.profile_path,
            self.store.briefing_path,
        ))
        ids = [item["id"] for item in reloaded.state["creator_objectives"]]

        self.assertIn(objective_a["id"], ids)
        self.assertIn(objective_b["id"], ids)

    async def test_failed_run_isolated_from_previous_latest_and_duplicate_failure(self):
        objective_a = snapshot("obj_a", "Objective A", "Constraint A")
        objective_b = snapshot("obj_b", "Objective B", "Constraint B")
        job_a = await self.enqueue_local(objective_a)
        job_b = await self.enqueue_local(objective_b)
        await self.runner.execute_worker_job(RecordingCore(), job_a["run_id"])
        latest_a = self.store.get_latest_briefing()
        failing = FailingCore()

        first = await self.runner.execute_worker_job(failing, job_b["run_id"])
        second = await self.runner.execute_worker_job(failing, job_b["run_id"])

        self.assertEqual("FAILED", first["status"])
        self.assertEqual("FAILED", second["status"])
        self.assertEqual(1, failing.calls)
        self.assertTrue(second["idempotent_replay"])
        self.assertIsNone(self.store.get_run_briefing(job_b["run_id"]))
        self.assertEqual(latest_a, self.store.get_latest_briefing())
        self.assertEqual(objective_b, self.runner.get_status(job_b["run_id"])["objective_snapshot"])
        self.assertEqual("obj_b", self.store.get_recent_runs()[0]["objective_id"])


if __name__ == "__main__":
    unittest.main()
