import json
import os
import subprocess
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

REAL_PLATFORM_MIND_ID = "8208493e-f36b-1410-8466-00039ce7df11"
EXPECTED_MIND_EMAIL = "udophia@hellominds.ai"
EXPECTED_MIND_WALLET = "0xB675Ec9857776678aE540cF3248d898f015987Cb"
OFFICIAL_BUILDER_API_BASE_URL = "https://api.build.hellominds.ai"


class MindsConfigurationError(Exception):
    """Raised when required Minds Builder configuration is missing."""


class MindsExecutionError(Exception):
    """Raised when a real Minds Builder operation fails."""


class AnimocaMindsBuilderClient:
    """Compatibility client for GreenRoom's one verified platform Mind."""

    def __init__(self, builder_api_key: str, base_url: str = OFFICIAL_BUILDER_API_BASE_URL):
        self.builder_api_key = builder_api_key
        self.base_url = base_url.rstrip("/")
        self.bridge_script = os.path.join(os.path.dirname(__file__), "minds_bridge.mjs")

    def _http_request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None, timeout: int = 15) -> Dict[str, Any]:
        request = urllib.request.Request(
            url=f"{self.base_url}{endpoint}",
            data=json.dumps(data).encode("utf-8") if data is not None else None,
            headers={"X-Api-Key": self.builder_api_key, "Content-Type": "application/json", "Accept": "application/json"},
            method=method.upper(),
        )
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                body = response.read()
                return json.loads(body.decode("utf-8")) if body else {}
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            raise MindsExecutionError(f"Minds Builder API HTTP {exc.code}: {body or exc.reason}") from exc
        except urllib.error.URLError as exc:
            raise MindsExecutionError(f"Minds Builder API connection failed: {exc.reason}") from exc

    def _run_bridge(self, *arguments: str, timeout: int = 15) -> Dict[str, Any]:
        environment = os.environ.copy()
        environment["MINDS_BUILDER_API_KEY"] = self.builder_api_key
        try:
            process = subprocess.run(["node", self.bridge_script, *arguments], capture_output=True, text=True, env=environment, timeout=timeout)
        except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
            raise MindsExecutionError(f"Official Minds client bridge failed: {exc}") from exc
        if not process.stdout:
            raise MindsExecutionError(process.stderr.strip() or "Official Minds client bridge returned no output")
        try:
            return json.loads(process.stdout)
        except json.JSONDecodeError as exc:
            raise MindsExecutionError("Official Minds client bridge returned invalid JSON") from exc

    def get_mind(self, mind_id: str) -> Dict[str, Any]:
        if os.path.exists(self.bridge_script):
            result = self._run_bridge("get-mind", mind_id)
            if result.get("ok") and isinstance(result.get("mind"), dict):
                return result["mind"]
        response = self._http_request("GET", f"/v1/minds/{mind_id}")
        mind = response.get("mind", response.get("data", response)) if isinstance(response, dict) else {}
        if isinstance(mind, dict) and "mindId" not in mind and "id" in mind:
            mind["mindId"] = mind["id"]
        return mind if isinstance(mind, dict) else {}

    def list_minds(self) -> List[Dict[str, Any]]:
        result = self._run_bridge("list-minds")
        if result.get("ok") and isinstance(result.get("minds"), list):
            return result["minds"]
        response = self._http_request("GET", "/v1/minds")
        if isinstance(response, list):
            return response
        return response.get("items", response.get("minds", [])) if isinstance(response, dict) else []

    def generate_completion(self, mind_id: str, prompt: str, alias: str = "greenroom-main") -> Dict[str, Any]:
        if not os.path.exists(self.bridge_script):
            raise MindsExecutionError("Official Minds client bridge is missing")
        result = self._run_bridge("interact", mind_id, prompt, alias, timeout=40)
        if not result.get("ok") or not result.get("reply"):
            raise MindsExecutionError(result.get("error", "No verified Mind reply received"))
        return {"ok": True, "mindId": mind_id, "alias": alias, "response": result["reply"], "afterFingerprint": result.get("afterFingerprint"), "status": "COMPLETED_VIA_ANIMOCA_MINDS_BUILDER_API"}


class GreenroomMindsIntegrationManager:
    """Identity, configuration, and status for GreenRoom's single persistent Mind."""

    def __init__(self):
        self.base_url = OFFICIAL_BUILDER_API_BASE_URL
        self.builder_client = AnimocaMindsBuilderClient(self.builder_api_key, self.base_url) if self.builder_api_key else None
        self.is_connected = False
        self.real_mind_data: Dict[str, Any] = {}

    @property
    def builder_api_key(self) -> str:
        return os.getenv("MINDS_BUILDER_API_KEY", "")

    @property
    def demo_mode(self) -> bool:
        return os.getenv("DEMO_MODE", "").lower() in ("true", "1")

    def validate_configuration(self):
        if not self.builder_api_key and not self.demo_mode:
            raise MindsConfigurationError("MINDS_BUILDER_API_KEY is required for a live Minds run")

    def verify_real_mind(self) -> Dict[str, Any]:
        if not self.builder_client:
            raise MindsExecutionError("MINDS_BUILDER_API_KEY is missing; Mind identity cannot be verified")
        mind = self.builder_client.get_mind(REAL_PLATFORM_MIND_ID)
        result = {"mindId": mind.get("mindId") or mind.get("id"), "email": mind.get("email"), "walletAddress": mind.get("walletAddress"), "isEnabled": mind.get("isEnabled")}
        result["verified"] = result["mindId"] == REAL_PLATFORM_MIND_ID and result["email"] == EXPECTED_MIND_EMAIL and result["walletAddress"] == EXPECTED_MIND_WALLET and result["isEnabled"] is True
        if result["verified"]:
            self.is_connected = True
            self.real_mind_data = dict(result)
        return result

    def get_status(self) -> Dict[str, Any]:
        from persistence import get_persistence_store

        store = get_persistence_store()
        mode = "production" if self.builder_api_key else ("demo" if self.demo_mode else "unconfigured")
        return {
            "mode": mode,
            "connected": self.is_connected,
            "verification_state": "VERIFIED" if self.is_connected else ("DEFERRED_TO_EXECUTION" if self.builder_api_key else "NOT_CONFIGURED"),
            "is_mock": self.demo_mode,
            "builder_api_configured": bool(self.builder_api_key),
            "builder_api_url": self.base_url,
            "qstash_configured": bool(os.getenv("QSTASH_TOKEN")),
            "persistence_mode": store.mode_label,
            "real_platform_mind": {"mindId": REAL_PLATFORM_MIND_ID, "email": self.real_mind_data.get("email"), "walletAddress": self.real_mind_data.get("walletAddress"), "isEnabled": self.real_mind_data.get("isEnabled")},
            "demo_mode_active": self.demo_mode,
            "configuration_valid": bool(self.builder_api_key) or self.demo_mode,
            "mind_model": "ONE_PERSISTENT_CREATOR_MIND",
        }


minds_manager = GreenroomMindsIntegrationManager()
GreenroomMindsEngine = GreenroomMindsIntegrationManager
