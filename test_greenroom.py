import os
import unittest
from unittest.mock import Mock, patch

from fastapi.routing import APIRoute

from minds_integration import (
    EXPECTED_MIND_EMAIL,
    EXPECTED_MIND_WALLET,
    REAL_PLATFORM_MIND_ID,
    GreenroomMindsIntegrationManager,
    MindsConfigurationError,
    MindsExecutionError,
)


class CurrentMindsCompatibilityTests(unittest.TestCase):
    def test_unconfigured_live_mode_fails_loudly(self):
        with patch.dict(os.environ, {"MINDS_BUILDER_API_KEY": "", "DEMO_MODE": ""}, clear=False):
            manager = GreenroomMindsIntegrationManager()
            with self.assertRaises(MindsConfigurationError):
                manager.validate_configuration()

    def test_status_exposes_one_persistent_mind_model(self):
        with patch.dict(os.environ, {"MINDS_BUILDER_API_KEY": "", "DEMO_MODE": ""}, clear=False):
            status = GreenroomMindsIntegrationManager().get_status()
        self.assertEqual("ONE_PERSISTENT_CREATOR_MIND", status["mind_model"])
        self.assertEqual(REAL_PLATFORM_MIND_ID, status["real_platform_mind"]["mindId"])
        self.assertNotIn("active_minds_agents", status)
        self.assertNotIn("greenroom_topology", status)

    def test_verified_identity_requires_all_authoritative_fields(self):
        manager = GreenroomMindsIntegrationManager()
        manager.builder_client = Mock()
        manager.builder_client.get_mind.return_value = {
            "mindId": REAL_PLATFORM_MIND_ID,
            "email": EXPECTED_MIND_EMAIL,
            "walletAddress": EXPECTED_MIND_WALLET,
            "isEnabled": True,
        }
        self.assertTrue(manager.verify_real_mind()["verified"])
        self.assertTrue(manager.is_connected)

    def test_incomplete_identity_is_never_verified(self):
        manager = GreenroomMindsIntegrationManager()
        manager.builder_client = Mock()
        manager.builder_client.get_mind.return_value = {
            "mindId": REAL_PLATFORM_MIND_ID,
            "email": EXPECTED_MIND_EMAIL,
            "isEnabled": True,
        }
        self.assertFalse(manager.verify_real_mind()["verified"])
        self.assertFalse(manager.is_connected)

    def test_bridge_failure_has_no_simulated_fallback(self):
        manager = GreenroomMindsIntegrationManager()
        manager.builder_client = Mock()
        manager.builder_client.generate_completion.side_effect = MindsExecutionError("bridge failed")
        with self.assertRaises(MindsExecutionError):
            manager.builder_client.generate_completion(REAL_PLATFORM_MIND_ID, "test")


class CurrentServerContractTests(unittest.TestCase):
    def test_fastapi_app_imports(self):
        import server

        self.assertEqual("GreenRoom: Persistent Creator Decision Intelligence", server.app.title)

    def test_only_current_creator_routes_remain(self):
        import server

        paths = {route.path for route in server.app.routes if isinstance(route, APIRoute)}
        required = {
            "/api/state",
            "/api/memory/preferences",
            "/api/minds/status",
            "/api/briefing/latest",
            "/api/briefing/run/{run_id}",
            "/api/briefing/trigger",
            "/api/briefing/status",
            "/api/briefing/recent",
            "/api/briefing/feedback",
            "/api/objective/create",
            "/api/objective/list",
            "/api/creator/onboard",
        }
        self.assertTrue(required.issubset(paths))
        self.assertFalse(any(path.startswith("/api/demo/") for path in paths))
        self.assertNotIn("/api/imp/history", paths)
        self.assertNotIn("/api/action/approve", paths)
        self.assertNotIn("/api/action/reject", paths)


if __name__ == "__main__":
    unittest.main()
