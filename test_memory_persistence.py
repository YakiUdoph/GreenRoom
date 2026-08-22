import tempfile
import unittest
from pathlib import Path

from memory_engine import GreenroomMemoryEngine
from persistence import LocalFileStore


class MemoryPreferencePersistenceTests(unittest.TestCase):
    def test_exact_preference_persists_across_engine_reload(self):
        with tempfile.TemporaryDirectory() as directory:
            profile = Path(directory) / "creator_profile.json"
            briefing = Path(directory) / "latest_briefing.json"
            preference = "  Keep my intentional spacing exactly.  "

            memory = GreenroomMemoryEngine(LocalFileStore(str(profile), str(briefing)))
            result = memory.remember_preference(preference)
            reloaded = GreenroomMemoryEngine(LocalFileStore(str(profile), str(briefing)))

            self.assertTrue(result["created"])
            self.assertIn(preference, reloaded.state["learned_voice_rules"])
            self.assertTrue(any(node.get("content") == preference for node in reloaded.state["memory_nodes"]))

    def test_duplicate_submission_is_idempotent(self):
        with tempfile.TemporaryDirectory() as directory:
            profile = Path(directory) / "creator_profile.json"
            store = LocalFileStore(str(profile), str(Path(directory) / "latest_briefing.json"))
            memory = GreenroomMemoryEngine(store)

            first = memory.remember_preference("Prefer practical examples.")
            second = memory.remember_preference("Prefer practical examples.")
            reloaded = GreenroomMemoryEngine(store)

            self.assertTrue(first["created"])
            self.assertFalse(second["created"])
            self.assertEqual(1, reloaded.state["learned_voice_rules"].count("Prefer practical examples."))
            self.assertEqual(1, sum(
                node.get("content") == "Prefer practical examples."
                for node in reloaded.state["memory_nodes"]
            ))

    def test_multiple_preferences_survive_stale_engine_instances_and_reload(self):
        with tempfile.TemporaryDirectory() as directory:
            profile = Path(directory) / "creator_profile.json"
            briefing = Path(directory) / "latest_briefing.json"
            first_engine = GreenroomMemoryEngine(LocalFileStore(str(profile), str(briefing)))
            stale_second_engine = GreenroomMemoryEngine(LocalFileStore(str(profile), str(briefing)))
            preferences = [
                "I prefer concise, direct answers with no clickbait",
                "Prioritize creator opportunities with clear monetary value.",
                "Keep recommendations grounded in evidence.",
            ]

            first_engine.remember_preference(preferences[0])
            stale_second_engine.remember_preference(preferences[1])
            first_engine.remember_preference(preferences[2])
            first_engine.remember_preference(preferences[0])
            reloaded = GreenroomMemoryEngine(LocalFileStore(str(profile), str(briefing)))

            for preference in preferences:
                self.assertIn(preference, reloaded.state["learned_voice_rules"])
                self.assertEqual(1, reloaded.state["learned_voice_rules"].count(preference))
            self.assertEqual(3, len(reloaded.state["learned_voice_rules"]))

    def test_blank_preference_is_rejected_without_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            profile = Path(directory) / "creator_profile.json"
            memory = GreenroomMemoryEngine(LocalFileStore(str(profile)))

            with self.assertRaises(ValueError):
                memory.remember_preference("   ")

            self.assertFalse(profile.exists())

    def test_api_handler_save_response_and_state_reload(self):
        import server

        with tempfile.TemporaryDirectory() as directory:
            profile = Path(directory) / "creator_profile.json"
            store = LocalFileStore(str(profile), str(Path(directory) / "latest_briefing.json"))
            original_memory = server.memory_tool
            server.memory_tool = GreenroomMemoryEngine(store)
            try:
                response = server.remember_preference(server.PreferenceRequest(
                    preference="Use exact, evidence-led language."
                ))
                refreshed = GreenroomMemoryEngine(store).get_full_state()

                self.assertEqual("success", response["status"])
                self.assertTrue(response["created"])
                self.assertIn("Use exact, evidence-led language.", response["state"]["learned_voice_rules"])
                self.assertIn("Use exact, evidence-led language.", refreshed["learned_voice_rules"])
            finally:
                server.memory_tool = original_memory


if __name__ == "__main__":
    unittest.main()
