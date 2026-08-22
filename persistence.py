import json
import os
import time
from typing import Dict, List, Any, Optional

class PersistenceStore:
    """Abstract base class for Greenroom Persistence Store."""
    @property
    def mode_label(self) -> str:
        """Returns 'LOCAL FILE', 'EPHEMERAL', or 'DURABLE'"""
        raise NotImplementedError

    def get_creator_profile(self) -> Dict[str, Any]:
        raise NotImplementedError

    def save_creator_profile(self, profile: Dict[str, Any]) -> None:
        raise NotImplementedError

    def get_latest_briefing(self) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    def save_briefing(self, briefing: Dict[str, Any]) -> None:
        raise NotImplementedError

    def save_feedback(self, entry: Dict[str, Any]) -> None:
        raise NotImplementedError

    def get_feedback_history(self) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def save_run_status(self, run_id: str, status_data: Dict[str, Any]) -> None:
        raise NotImplementedError

    def get_run_status(self, run_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError


class LocalFileStore(PersistenceStore):
    """Local File Persistence Store for local development & testing."""
    def __init__(self, profile_path: str = "creator_profile.json", briefing_path: str = "latest_briefing.json"):
        self.profile_path = profile_path
        self.briefing_path = briefing_path
        self.run_status_path = "run_statuses.json"

    @property
    def mode_label(self) -> str:
        return "LOCAL FILE"

    def get_creator_profile(self) -> Dict[str, Any]:
        if os.path.exists(self.profile_path):
            try:
                with open(self.profile_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[LocalFileStore] Error reading profile: {e}")
        return self._default_profile()

    def save_creator_profile(self, profile: Dict[str, Any]) -> None:
        try:
            with open(self.profile_path, "w", encoding="utf-8") as f:
                json.dump(profile, f, indent=2)
        except Exception as e:
            print(f"[LocalFileStore] Failed to save profile: {e}")

    def get_latest_briefing(self) -> Optional[Dict[str, Any]]:
        if os.path.exists(self.briefing_path):
            try:
                with open(self.briefing_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return None

    def save_briefing(self, briefing: Dict[str, Any]) -> None:
        try:
            with open(self.briefing_path, "w", encoding="utf-8") as f:
                json.dump(briefing, f, indent=2)
        except Exception as e:
            print(f"[LocalFileStore] Failed to save briefing: {e}")

    def save_feedback(self, entry: Dict[str, Any]) -> None:
        profile = self.get_creator_profile()
        profile.setdefault("item_feedbacks", []).append(entry)
        self.save_creator_profile(profile)

    def get_feedback_history(self) -> List[Dict[str, Any]]:
        return self.get_creator_profile().get("item_feedbacks", [])

    def save_run_status(self, run_id: str, status_data: Dict[str, Any]) -> None:
        statuses = {}
        if os.path.exists(self.run_status_path):
            try:
                with open(self.run_status_path, "r", encoding="utf-8") as f:
                    statuses = json.load(f)
            except Exception:
                pass
        statuses[run_id] = status_data
        try:
            with open(self.run_status_path, "w", encoding="utf-8") as f:
                json.dump(statuses, f, indent=2)
        except Exception as e:
            print(f"[LocalFileStore] Error saving run status: {e}")

    def get_run_status(self, run_id: str) -> Optional[Dict[str, Any]]:
        if os.path.exists(self.run_status_path):
            try:
                with open(self.run_status_path, "r", encoding="utf-8") as f:
                    statuses = json.load(f)
                    return statuses.get(run_id)
            except Exception:
                pass
        return None

    def _default_profile(self) -> Dict[str, Any]:
        return {
            "creator_name": "Alex Rivera",
            "brand_voice_attributes": ["Educational", "Technical yet accessible", "Direct"],
            "content_performance_history": [],
            "audience_demographics": {"primary_age": "22-35"},
            "rejected_topics": ["Crypto trading bots", "Generic AI news clickbait"],
            "monetization_benchmarks": {"cpm_target": 45, "minimum_deal_size": 5000},
            "learned_voice_rules": [],
            "memory_nodes": [],
            "decision_history": []
        }


class EphemeralTmpStore(PersistenceStore):
    """
    Fallback Ephemeral Storage for Serverless environments (e.g. Vercel /tmp).
    Truthfully labeled as EPHEMERAL since /tmp files can be lost on cold starts or instance recycles.
    """
    def __init__(self):
        self.profile_path = "/tmp/creator_profile.json"
        self.briefing_path = "/tmp/latest_briefing.json"
        self.run_status_path = "/tmp/run_statuses.json"

    @property
    def mode_label(self) -> str:
        return "EPHEMERAL"

    def get_creator_profile(self) -> Dict[str, Any]:
        if os.path.exists(self.profile_path):
            try:
                with open(self.profile_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "creator_name": "Alex Rivera",
            "brand_voice_attributes": ["Educational", "Technical yet accessible", "Direct"],
            "content_performance_history": [],
            "audience_demographics": {"primary_age": "22-35"},
            "rejected_topics": ["Crypto trading bots", "Generic AI news clickbait"],
            "monetization_benchmarks": {"cpm_target": 45, "minimum_deal_size": 5000},
            "learned_voice_rules": [],
            "memory_nodes": []
        }

    def save_creator_profile(self, profile: Dict[str, Any]) -> None:
        try:
            with open(self.profile_path, "w", encoding="utf-8") as f:
                json.dump(profile, f, indent=2)
        except Exception:
            pass

    def get_latest_briefing(self) -> Optional[Dict[str, Any]]:
        if os.path.exists(self.briefing_path):
            try:
                with open(self.briefing_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return None

    def save_briefing(self, briefing: Dict[str, Any]) -> None:
        try:
            with open(self.briefing_path, "w", encoding="utf-8") as f:
                json.dump(briefing, f, indent=2)
        except Exception:
            pass

    def save_feedback(self, entry: Dict[str, Any]) -> None:
        profile = self.get_creator_profile()
        profile.setdefault("item_feedbacks", []).append(entry)
        self.save_creator_profile(profile)

    def get_feedback_history(self) -> List[Dict[str, Any]]:
        return self.get_creator_profile().get("item_feedbacks", [])

    def save_run_status(self, run_id: str, status_data: Dict[str, Any]) -> None:
        statuses = {}
        if os.path.exists(self.run_status_path):
            try:
                with open(self.run_status_path, "r", encoding="utf-8") as f:
                    statuses = json.load(f)
            except Exception:
                pass
        statuses[run_id] = status_data
        try:
            with open(self.run_status_path, "w", encoding="utf-8") as f:
                json.dump(statuses, f, indent=2)
        except Exception:
            pass

    def get_run_status(self, run_id: str) -> Optional[Dict[str, Any]]:
        if os.path.exists(self.run_status_path):
            try:
                with open(self.run_status_path, "r", encoding="utf-8") as f:
                    statuses = json.load(f)
                    return statuses.get(run_id)
            except Exception:
                pass
        return None


class UpstashRedisStore(PersistenceStore):
    """
    Durable Storage Provider using Upstash Redis / Vercel KV REST API.
    Active when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in environment.
    """
    def __init__(self, url: str, token: str):
        self.url = url.rstrip("/")
        self.token = token

    @property
    def mode_label(self) -> str:
        return "DURABLE"

    def _redis_cmd(self, command: List[str]) -> Any:
        import urllib.request
        import urllib.error
        req_url = f"{self.url}"
        req = urllib.request.Request(
            req_url,
            data=json.dumps(command).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data.get("result")
        except Exception as e:
            raise RuntimeError(f"Upstash command {command[0]} failed: {e}") from e

    def get_creator_profile(self) -> Dict[str, Any]:
        val = self._redis_cmd(["GET", "greenroom:creator_profile"])
        if val:
            try:
                return json.loads(val)
            except Exception:
                pass
        return {
            "creator_name": "Alex Rivera",
            "brand_voice_attributes": ["Educational", "Technical yet accessible", "Direct"],
            "content_performance_history": [],
            "audience_demographics": {"primary_age": "22-35"},
            "rejected_topics": ["Crypto trading bots", "Generic AI news clickbait"],
            "monetization_benchmarks": {"cpm_target": 45, "minimum_deal_size": 5000},
            "learned_voice_rules": [],
            "memory_nodes": []
        }

    def save_creator_profile(self, profile: Dict[str, Any]) -> None:
        self._redis_cmd(["SET", "greenroom:creator_profile", json.dumps(profile)])

    def get_latest_briefing(self) -> Optional[Dict[str, Any]]:
        val = self._redis_cmd(["GET", "greenroom:latest_briefing"])
        if val:
            try:
                return json.loads(val)
            except Exception:
                pass
        return None

    def save_briefing(self, briefing: Dict[str, Any]) -> None:
        self._redis_cmd(["SET", "greenroom:latest_briefing", json.dumps(briefing)])

    def save_feedback(self, entry: Dict[str, Any]) -> None:
        profile = self.get_creator_profile()
        profile.setdefault("item_feedbacks", []).append(entry)
        self.save_creator_profile(profile)

    def get_feedback_history(self) -> List[Dict[str, Any]]:
        return self.get_creator_profile().get("item_feedbacks", [])

    def save_run_status(self, run_id: str, status_data: Dict[str, Any]) -> None:
        self._redis_cmd(["SET", f"greenroom:run_status:{run_id}", json.dumps(status_data)])

    def get_run_status(self, run_id: str) -> Optional[Dict[str, Any]]:
        val = self._redis_cmd(["GET", f"greenroom:run_status:{run_id}"])
        if val:
            try:
                return json.loads(val)
            except Exception:
                pass
        return None


def get_persistence_store() -> PersistenceStore:
    """
    Factory function returning the appropriate PersistenceStore:
    1. UpstashRedisStore (DURABLE) if UPSTASH_REDIS_REST_URL / KV_REST_API_URL and Token are set in env.
    2. LocalFileStore (LOCAL FILE) if running locally or non-serverless.
    3. EphemeralTmpStore (EPHEMERAL) fallback for serverless without Redis.
    """
    redis_url = os.getenv("UPSTASH_REDIS_REST_URL") or os.getenv("KV_REST_API_URL")
    redis_token = os.getenv("UPSTASH_REDIS_REST_TOKEN") or os.getenv("KV_REST_API_TOKEN")

    if redis_url and redis_token:
        return UpstashRedisStore(redis_url, redis_token)

    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return EphemeralTmpStore()

    return LocalFileStore()

