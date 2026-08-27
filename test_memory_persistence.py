import tempfile
import unittest
from pathlib import Path

from memory_engine import GreenroomMemoryEngine, preference_equivalence_key
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

    def test_memory_quality_gate_rejection_and_acceptance(self):
        with tempfile.TemporaryDirectory() as directory:
            profile = Path(directory) / "creator_profile.json"
            store = LocalFileStore(str(profile), str(Path(directory) / "latest_briefing.json"))
            memory = GreenroomMemoryEngine(store)

            # 1. Test conversational noise rejection
            rejections = [
                "Hi",
                "Hello",
                "Thanks",
                "Okay",
                "Test",
                "What can you do?",
                "What does GreenRoom know about me that survives between sessions?"
            ]
            for item in rejections:
                with self.assertRaises(ValueError):
                    memory.remember_preference(item)

            # 2. Test valid preferences acceptance
            acceptances = [
                "Prefer free or low-cost tools.",
                "Keep recommendations practical and concise.",
                "Avoid clickbait-style content ideas.",
                "Prioritize creator opportunities with clear monetary value.",
                "I prefer tools that work without expensive subscriptions."
            ]
            for item in acceptances:
                res = memory.remember_preference(item)
                self.assertTrue(res["created"])
                self.assertIn(item, memory.state["learned_voice_rules"])

    def test_historical_cleanup_removes_only_exact_known_noise(self):
        with tempfile.TemporaryDirectory() as directory:
            profile = Path(directory) / "creator_profile.json"
            store = LocalFileStore(str(profile), str(Path(directory) / "latest_briefing.json"))
            state = store.get_creator_profile()
            state["learned_voice_rules"] = [
                "Hi",
                "What does GreenRoom know about me that survives between sessions?",
                "Prefer practical recommendations.",
                "A strange but potentially legitimate creator note.",
            ]
            state["memory_nodes"] = [
                {"type": "learned_preference", "content": "Hello"},
                {"type": "learned_preference", "content": "Prefer practical recommendations."},
                {"type": "research_note", "content": "Test"},
            ]
            store.save_creator_profile(state)

            memory = GreenroomMemoryEngine(store)

            self.assertEqual(
                ["Hi", "What does GreenRoom know about me that survives between sessions?", "Hello"],
                memory.historical_noise_removed,
            )
            self.assertIn("Prefer practical recommendations.", memory.state["learned_voice_rules"])
            self.assertIn("A strange but potentially legitimate creator note.", memory.state["learned_voice_rules"])
            self.assertTrue(any(node.get("type") == "research_note" for node in memory.state["memory_nodes"]))

    def test_equivalent_future_preferences_are_idempotent(self):
        with tempfile.TemporaryDirectory() as directory:
            store = LocalFileStore(str(Path(directory) / "creator_profile.json"))
            memory = GreenroomMemoryEngine(store)
            first = memory.remember_preference("Keep recommendations concise and practical")
            duplicate = memory.remember_preference("i prefer concise, practical recommendations")
            reordered = memory.remember_preference("keep recommendations practical and concise")

            self.assertTrue(first["created"])
            self.assertFalse(duplicate["created"])
            self.assertFalse(reordered["created"])
            self.assertEqual("Keep recommendations concise and practical", duplicate["equivalent_to"])
            self.assertEqual(1, len(memory.state["learned_voice_rules"]))
            self.assertEqual(1, len(memory.state["memory_nodes"]))

    def test_historical_duplicate_cleanup_keeps_strongest_representatives(self):
        with tempfile.TemporaryDirectory() as directory:
            store = LocalFileStore(str(Path(directory) / "creator_profile.json"))
            state = store.get_creator_profile()
            state["learned_voice_rules"] = [
                "Keep recommendations concise and practical",
                "i prefer concise, practical recommendations",
                "keep recommendation concise and practical",
                "keep recommendations practical and concise",
                "Prefer free or low-cost tools.",
                "prefer free tools",
                "Avoid clickbait-style content ideas",
                "Prioritize creator opportunities with clear monetary value.",
            ]
            state["memory_nodes"] = [
                {"type": "learned_preference", "content": rule}
                for rule in state["learned_voice_rules"]
            ]
            store.save_creator_profile(state)

            memory = GreenroomMemoryEngine(store)

            self.assertEqual([
                "Keep recommendations concise and practical",
                "Prefer free or low-cost tools.",
                "Avoid clickbait-style content ideas",
                "Prioritize creator opportunities with clear monetary value.",
            ], memory.state["learned_voice_rules"])
            self.assertEqual(4, len(memory.state["memory_nodes"]))
            self.assertEqual(4, len(memory.duplicate_preferences_removed))

    def test_distinct_preferences_remain_separate(self):
        preferences = [
            "Keep recommendations concise and practical",
            "Keep recommendations concise and evidence-led",
            "Prefer free or low-cost tools.",
            "Avoid clickbait-style content ideas",
        ]
        self.assertEqual(len(preferences), len({preference_equivalence_key(item) for item in preferences}))


if __name__ == "__main__":
    unittest.main()
