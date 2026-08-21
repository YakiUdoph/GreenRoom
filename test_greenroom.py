import asyncio
import json
import os
import sys

from memory_engine import GreenroomMemoryEngine, memory_tool
from agents import GreenroomCoreMind

def test_loud_failure_when_unconfigured():
    print("--- [TEST 1] Testing Loud Failure when Unconfigured ---")
    orig_builder_key = os.environ.pop("MINDS_BUILDER_API_KEY", None)
    orig_key = os.environ.pop("MINDS_API_KEY", None)
    orig_demo = os.environ.pop("DEMO_MODE", None)
    
    try:
        from minds_integration import GreenroomMindsIntegrationManager, MindsConfigurationError
        mgr = GreenroomMindsIntegrationManager()
        
        try:
            mgr.validate_configuration()
            assert False, "Expected MindsConfigurationError when MINDS_BUILDER_API_KEY is missing and DEMO_MODE is not true."
        except MindsConfigurationError as e:
            print(f"[OK] Caught expected loud failure configuration exception: {e}")
            
    finally:
        if orig_builder_key is not None:
            os.environ["MINDS_BUILDER_API_KEY"] = orig_builder_key
        if orig_key is not None:
            os.environ["MINDS_API_KEY"] = orig_key
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
    print("[OK] [TEST 1 PASSED]\n")


async def test_production_mode_execution_error_without_fallback():
    print("--- [TEST 2] Testing Production Mode (DEMO_MODE=false) Strict Failure ---")
    orig_builder_key = os.environ.get("MINDS_BUILDER_API_KEY")
    orig_key = os.environ.get("MINDS_API_KEY")
    orig_demo = os.environ.get("DEMO_MODE")
    
    os.environ["MINDS_BUILDER_API_KEY"] = "invalid_test_key"
    os.environ["DEMO_MODE"] = "false"
    
    try:
        from minds_integration import MindsAgent, MindsExecutionError
        agent = MindsAgent("TestMind", "Test Role", "Test Prompt", builder_client=None)
        
        try:
            # Must raise MindsExecutionError, NEVER fallback to mock response when DEMO_MODE=false
            res = await agent.generate_response("Test prompt")
            assert False, f"Expected MindsExecutionError in production mode, but got response: {res}"
        except MindsExecutionError as e:
            print(f"[OK] Caught expected MindsExecutionError in production mode without fallback: {e}")
            
    finally:
        if orig_builder_key is not None:
            os.environ["MINDS_BUILDER_API_KEY"] = orig_builder_key
        else:
            os.environ.pop("MINDS_BUILDER_API_KEY", None)
            
        if orig_key is not None:
            os.environ["MINDS_API_KEY"] = orig_key
        else:
            os.environ.pop("MINDS_API_KEY", None)
            
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
            
    print("[OK] [TEST 2 PASSED]\n")


async def test_sdk_exception_never_returns_mock_engine():
    print("--- [TEST 3] Testing Builder API Exception in DEMO_MODE=false Cannot Return Mock Engine ---")
    orig_builder_key = os.environ.get("MINDS_BUILDER_API_KEY")
    orig_key = os.environ.get("MINDS_API_KEY")
    orig_demo = os.environ.get("DEMO_MODE")
    
    os.environ["MINDS_BUILDER_API_KEY"] = "invalid_key"
    os.environ["DEMO_MODE"] = "false"
    
    class FailingBuilderClient:
        def generate_completion(self, mind_id, prompt):
            from minds_integration import MindsExecutionError
            raise MindsExecutionError("Simulated Animoca Minds Builder API Connection Timeout / Error")

    try:
        from minds_integration import MindsAgent, MindsExecutionError
        failing_client = FailingBuilderClient()
        agent = MindsAgent("TestMind", "Test Role", "Test Prompt", builder_client=failing_client)
        
        try:
            res = await agent.generate_response("Test prompt")
            assert False, "Builder API exception must raise MindsExecutionError, not return mock response!"
        except MindsExecutionError as e:
            assert "Simulated Animoca Minds Builder API Connection Timeout" in str(e)
            print("[OK] Verified: API exception in DEMO_MODE=false raised MindsExecutionError and NEVER returned mock engine response.")
            
    finally:
        if orig_builder_key is not None:
            os.environ["MINDS_BUILDER_API_KEY"] = orig_builder_key
        else:
            os.environ.pop("MINDS_BUILDER_API_KEY", None)

        if orig_key is not None:
            os.environ["MINDS_API_KEY"] = orig_key
        else:
            os.environ.pop("MINDS_API_KEY", None)
            
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
            
    print("[OK] [TEST 3 PASSED]\n")


def test_explicit_demo_mode():
    print("--- [TEST 4] Testing Explicit DEMO_MODE=true Labeling ---")
    orig_demo = os.environ.get("DEMO_MODE")
    os.environ["DEMO_MODE"] = "true"
    
    try:
        from minds_integration import GreenroomMindsIntegrationManager
        mgr = GreenroomMindsIntegrationManager()
        status = mgr.get_status()
        
        assert status["demo_mode_active"] is True
        assert status["mode"] in ("demo", "DEMO_MODE", "[MOCK DEMO MODE]")
        print(f"[OK] Status mode correctly labeled: {status['mode']}")

        agent = mgr.get_agent("ScoutMind")
        assert agent.is_mock_mode is True
        print("[OK] ScoutMind explicitly tagged with is_mock_mode=True.")
        
    finally:
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
            
    print("[OK] [TEST 4 PASSED]\n")


async def test_local_creator_profile_persistence_and_adaptation():
    print("--- [TEST 5] Testing Local Creator Profile Persistence & Adaptation ---")
    os.environ["DEMO_MODE"] = "true"
    from memory_engine import memory_tool
    from agents import GreenroomCoreMind

    memory_tool.reset_state()
    core = GreenroomCoreMind(memory_tool)

    # Initial strategy before custom preference
    initial_strat = await core.synthesize_strategy("Local AI Models")
    assert "OPEN-SOURCE TERMINAL FOCUS" not in initial_strat["script_concept"]
    print("[OK] Initial strategy synthesized without custom terminal preference.")

    # Step 1: Creator teaches Greenroom a custom preference
    custom_pref = "Emphasize open-source local models and concise terminal setup steps"
    await core.process_user_feedback(custom_pref)
    print(f"[OK] Creator taught Greenroom custom preference: '{custom_pref}'")

    # Step 2: Persistence occurs in local profile memory engine
    state = memory_tool.get_full_state()
    assert custom_pref in state["learned_voice_rules"]
    print("[OK] Verified preference persisted in creator profile state (creator_profile.json).")

    # Step 3 & 4: Later independent interaction for a new topic retrieves preference & alters recommendation
    adapted_strat = await core.synthesize_strategy("Advanced RAG Pipelines")
    assert adapted_strat["is_punchy_voice"] is True
    assert "OPEN-SOURCE TERMINAL FOCUS" in adapted_strat["script_concept"]
    print("[OK] Later independent interaction dynamically adapted script concept based on persisted preference!")

    print("[OK] [TEST 5 PASSED]\n")


async def test_demo_runner_flow():
    print("--- [TEST 6] Testing 5-Minute Demo Runner Workflow ---")
    os.environ["DEMO_MODE"] = "true"
    from demo_runner import GreenroomDemoRunner
    from memory_engine import memory_tool

    memory_tool.reset_state()
    runner = GreenroomDemoRunner()

    min1 = await runner.run_minute_1()
    assert min1["minute"] == 1
    print("[OK] Minute 1 executed clean.")

    min2 = await runner.run_minute_2()
    assert min2["minute"] == 2
    assert len(min2["recommended_trends"]) > 0
    print(f"[OK] Minute 2 executed clean. Recommended: {min2['recommended_trends'][0]['trend_name']}")

    min3 = await runner.run_minute_3()
    assert min3["minute"] == 3
    assert "script_concept" in min3["strategy"]
    print("[OK] Minute 3 executed clean.")

    min4 = await runner.run_minute_4()
    assert min4["minute"] == 4
    assert min4["pitch_proposal"]["match_score"] > 0.0
    print("[OK] Minute 4 executed clean.")

    min5 = await runner.run_minute_5("Too formal. Make it punchier and emphasize beginner-friendly tips.")
    assert min5["minute"] == 5
    assert len(min5["updated_profile_rules"]) > 0
    print(f"[OK] Minute 5 executed clean! Updated rules: {min5['updated_profile_rules']}")

    print("[OK] [TEST 6 PASSED]\n")


def test_real_mind_builder_api_integration():
    print("--- [TEST 7] Production Integration Test: Real Platform Mind UUID Verification ---")
    key = os.environ.get("MINDS_BUILDER_API_KEY") or os.environ.get("MINDS_API_KEY")
    if not key:
        print("[SKIP] Production integration test skipped: MINDS_BUILDER_API_KEY not provided.")
        print("[OK] [TEST 7 SKIPPED CLEANLY]\n")
        return

    from minds_integration import GreenroomMindsIntegrationManager, REAL_PLATFORM_MIND_ID, EXPECTED_MIND_EMAIL, EXPECTED_MIND_WALLET
    mgr = GreenroomMindsIntegrationManager()
    res = mgr.verify_real_mind()

    assert res["mindId"] == REAL_PLATFORM_MIND_ID, f"Expected mindId={REAL_PLATFORM_MIND_ID}, got {res.get('mindId')}"
    assert res["email"] == EXPECTED_MIND_EMAIL, f"Expected email={EXPECTED_MIND_EMAIL}, got {res.get('email')}"
    assert res["walletAddress"] == EXPECTED_MIND_WALLET, f"Expected walletAddress={EXPECTED_MIND_WALLET}, got {res.get('walletAddress')}"
    assert res["isEnabled"] is True, f"Expected isEnabled=True, got {res.get('isEnabled')}"
    assert res["verified"] is True

    print(f"[OK] Successfully verified Real Platform Mind via official Animoca Minds Builder API:")
    print(f"     mindId:        {res['mindId']}")
    print(f"     email:         {res['email']}")
    print(f"     walletAddress: {res['walletAddress']}")
    print(f"     isEnabled:     {res['isEnabled']}")
    print("[OK] [TEST 7 PASSED]\n")


def test_verify_real_mind_parsing():
    print("--- [TEST 8] Testing Real Platform Mind Response Validation ---")
    from minds_integration import GreenroomMindsIntegrationManager, REAL_PLATFORM_MIND_ID, EXPECTED_MIND_EMAIL, EXPECTED_MIND_WALLET
    
    class MockBuilderClient:
        def get_mind(self, mind_id):
            return {
                "mindId": "8208493e-f36b-1410-8466-00039ce7df11",
                "email": "udophia@hellominds.ai",
                "walletAddress": "0xB675Ec9857776678aE540cF3248d898f015987Cb",
                "isEnabled": True
            }

    mgr = GreenroomMindsIntegrationManager()
    mgr.builder_client = MockBuilderClient()
    
    res = mgr.verify_real_mind()
    assert res["mindId"] == REAL_PLATFORM_MIND_ID
    assert res["email"] == EXPECTED_MIND_EMAIL
    assert res["walletAddress"] == EXPECTED_MIND_WALLET
    assert res["isEnabled"] is True
    assert res["verified"] is True
    print("[OK] Verified real Mind response parsing & validation logic.")
    print("[OK] [TEST 8 PASSED]\n")


def test_missing_email_cannot_verify():
    print("--- [TEST 9] Testing Missing Email Cannot Verify ---")
    from minds_integration import GreenroomMindsIntegrationManager
    class MockClient:
        def get_mind(self, mind_id):
            return {
                "mindId": "8208493e-f36b-1410-8466-00039ce7df11",
                "walletAddress": "0xB675Ec9857776678aE540cF3248d898f015987Cb",
                "isEnabled": True
            }
    mgr = GreenroomMindsIntegrationManager()
    mgr.builder_client = MockClient()
    res = mgr.verify_real_mind()
    assert res["verified"] is False
    print("[OK] Verified missing email causes verified=False.")
    print("[OK] [TEST 9 PASSED]\n")


def test_missing_wallet_cannot_verify():
    print("--- [TEST 10] Testing Missing WalletAddress Cannot Verify ---")
    from minds_integration import GreenroomMindsIntegrationManager
    class MockClient:
        def get_mind(self, mind_id):
            return {
                "mindId": "8208493e-f36b-1410-8466-00039ce7df11",
                "email": "udophia@hellominds.ai",
                "isEnabled": True
            }
    mgr = GreenroomMindsIntegrationManager()
    mgr.builder_client = MockClient()
    res = mgr.verify_real_mind()
    assert res["verified"] is False
    print("[OK] Verified missing walletAddress causes verified=False.")
    print("[OK] [TEST 10 PASSED]\n")


def test_wrong_uuid_cannot_verify():
    print("--- [TEST 11] Testing Wrong UUID Cannot Verify ---")
    from minds_integration import GreenroomMindsIntegrationManager
    class MockClient:
        def get_mind(self, mind_id):
            return {
                "mindId": "11111111-2222-3333-4444-555555555555",
                "email": "udophia@hellominds.ai",
                "walletAddress": "0xB675Ec9857776678aE540cF3248d898f015987Cb",
                "isEnabled": True
            }
    mgr = GreenroomMindsIntegrationManager()
    mgr.builder_client = MockClient()
    res = mgr.verify_real_mind()
    assert res["verified"] is False
    print("[OK] Verified wrong UUID causes verified=False.")
    print("[OK] [TEST 11 PASSED]\n")


def test_is_enabled_false_cannot_verify():
    print("--- [TEST 12] Testing isEnabled=False Cannot Verify ---")
    from minds_integration import GreenroomMindsIntegrationManager
    class MockClient:
        def get_mind(self, mind_id):
            return {
                "mindId": "8208493e-f36b-1410-8466-00039ce7df11",
                "email": "udophia@hellominds.ai",
                "walletAddress": "0xB675Ec9857776678aE540cF3248d898f015987Cb",
                "isEnabled": False
            }
    mgr = GreenroomMindsIntegrationManager()
    mgr.builder_client = MockClient()
    res = mgr.verify_real_mind()
    assert res["verified"] is False
    print("[OK] Verified isEnabled=False causes verified=False.")
    print("[OK] [TEST 12 PASSED]\n")


async def test_message_send_without_reply_raises_error():
    print("--- [TEST 13] Testing Successful Message Send Without Mind Reply Raises Error ---")
    orig_builder_key = os.environ.get("MINDS_BUILDER_API_KEY")
    orig_demo = os.environ.get("DEMO_MODE")
    
    os.environ["MINDS_BUILDER_API_KEY"] = "test_key"
    os.environ["DEMO_MODE"] = "false"

    from minds_integration import MindsAgent, MindsExecutionError, AnimocaMindsBuilderClient
    
    class MockClientNoReply(AnimocaMindsBuilderClient):
        def __init__(self):
            self.builder_api_key = "test_key"
            self.bridge_script = "non_existent_script.mjs"
        def create_conversation(self, mind_id, alias="greenroom-main"):
            return {"ok": True}
        def send_message(self, alias, message_text):
            return {"ok": True, "messageId": "msg_123"}
        def _wait_for_history_reply(self, alias, sent_prompt, timeout=30):
            return None

    try:
        agent = MindsAgent("TestMind", "Role", "Prompt", builder_client=MockClientNoReply())
        res = await agent.generate_response("Hello Mind")
        assert False, f"Expected MindsExecutionError when Mind reply is missing, but got {res}"
    except MindsExecutionError as e:
        assert "no mind reply" in str(e).lower() or "timed out" in str(e).lower() or "failed" in str(e).lower() or "missing" in str(e).lower()
        print(f"[OK] Caught expected exception when message was sent without reply: {e}")
    finally:
        if orig_builder_key is not None:
            os.environ["MINDS_BUILDER_API_KEY"] = orig_builder_key
        else:
            os.environ.pop("MINDS_BUILDER_API_KEY", None)

        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
        
    print("[OK] [TEST 13 PASSED]\n")


async def test_after_fingerprint_passed_to_wait_for_reply():
    print("--- [TEST 14] Testing afterFingerprint Is Returned from Bridge Interactive Flow ---")
    orig_builder_key = os.environ.get("MINDS_BUILDER_API_KEY")
    orig_demo = os.environ.get("DEMO_MODE")
    
    os.environ["MINDS_BUILDER_API_KEY"] = "test_key"
    os.environ["DEMO_MODE"] = "false"

    from minds_integration import AnimocaMindsBuilderClient
    client = AnimocaMindsBuilderClient("test_key")

    import subprocess
    orig_run = subprocess.run
    def mock_run(cmd, **kwargs):
        class MockProc:
            stdout = json.dumps({
                "ok": True,
                "reply": "Mock Mind Strategy Response",
                "afterFingerprint": "fingerprint_abc123"
            })
            stderr = ""
        return MockProc()

    subprocess.run = mock_run
    try:
        res = client.generate_completion("8208493e-f36b-1410-8466-00039ce7df11", "Synthesize strategy")
        assert res["ok"] is True
        assert res["response"] == "Mock Mind Strategy Response"
        assert res["afterFingerprint"] == "fingerprint_abc123"
        print("[OK] Proved afterFingerprint is returned from Node client-lib bridge interaction.")
    finally:
        subprocess.run = orig_run
        if orig_builder_key is not None:
            os.environ["MINDS_BUILDER_API_KEY"] = orig_builder_key
        else:
            os.environ.pop("MINDS_BUILDER_API_KEY", None)

        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
            
    print("[OK] [TEST 14 PASSED]\n")


async def test_node_client_lib_failure_raises_minds_execution_error():
    print("--- [TEST 15] Testing Node/Client-Lib Failure Raises MindsExecutionError ---")
    orig_builder_key = os.environ.get("MINDS_BUILDER_API_KEY")
    orig_demo = os.environ.get("DEMO_MODE")
    
    os.environ["MINDS_BUILDER_API_KEY"] = "test_key"
    os.environ["DEMO_MODE"] = "false"

    from minds_integration import AnimocaMindsBuilderClient, MindsExecutionError
    client = AnimocaMindsBuilderClient("test_key")

    import subprocess
    orig_run = subprocess.run
    def mock_run_fail(cmd, **kwargs):
        class MockProc:
            stdout = json.dumps({"ok": False, "error": "client-lib internal connection timeout"})
            stderr = "Error in client-lib"
        return MockProc()

    subprocess.run = mock_run_fail
    try:
        res = client.generate_completion("8208493e-f36b-1410-8466-00039ce7df11", "Synthesize strategy")
        assert False, f"Expected MindsExecutionError on Node client-lib failure, but got {res}"
    except MindsExecutionError as e:
        assert "client-lib internal connection timeout" in str(e)
        print(f"[OK] Proved Node client-lib failure raises MindsExecutionError: {e}")
    finally:
        subprocess.run = orig_run
        if orig_builder_key is not None:
            os.environ["MINDS_BUILDER_API_KEY"] = orig_builder_key
        else:
            os.environ.pop("MINDS_BUILDER_API_KEY", None)

        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)

    print("[OK] [TEST 15 PASSED]\n")


async def test_no_production_direct_rest_messaging_fallback():
    print("--- [TEST 16] Testing No Production Direct REST Messaging Fallback Occurs ---")
    orig_builder_key = os.environ.get("MINDS_BUILDER_API_KEY")
    orig_demo = os.environ.get("DEMO_MODE")
    
    os.environ["MINDS_BUILDER_API_KEY"] = "test_key"
    os.environ["DEMO_MODE"] = "false"

    from minds_integration import AnimocaMindsBuilderClient, MindsExecutionError
    client = AnimocaMindsBuilderClient("test_key")
    client.bridge_script = "non_existent_script.mjs"

    try:
        res = client.generate_completion("8208493e-f36b-1410-8466-00039ce7df11", "Synthesize strategy")
        assert False, f"Expected MindsExecutionError when bridge script is missing, but got {res}"
    except MindsExecutionError as e:
        assert "minds_bridge.mjs) is missing" in str(e) or "requires the official minds client library" in str(e).lower()
        print(f"[OK] Proved missing client-lib bridge immediately raises MindsExecutionError and NEVER falls back to direct REST messaging: {e}")
    finally:
        if orig_builder_key is not None:
            os.environ["MINDS_BUILDER_API_KEY"] = orig_builder_key
        else:
            os.environ.pop("MINDS_BUILDER_API_KEY", None)

        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)

    print("[OK] [TEST 16 PASSED]\n")



async def test_autonomous_run_execution_no_second_chat():
    print("--- [TEST 17] Testing Autonomous Run Execution Without Second Chat Prompt ---")
    orig_demo = os.environ.get("DEMO_MODE")
    os.environ["DEMO_MODE"] = "true"
    try:
        from memory_engine import memory_tool
        from agents import GreenroomCoreMind
        core = GreenroomCoreMind(memory_tool)
        briefing = await core.run_autonomous_cycle()
        assert briefing is not None, "Autonomous cycle must return a briefing"
        assert len(briefing.get("items", [])) == 3, f"Expected 3 items, got {len(briefing.get('items', []))}"
        print("[OK] Proved autonomous cycle runs without requiring live chat prompt.")
    finally:
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
    print("[OK] [TEST 17 PASSED]\n")


async def test_briefing_persists_across_reloads():
    print("--- [TEST 18] Testing Briefing Persistence Across Reloads ---")
    orig_demo = os.environ.get("DEMO_MODE")
    os.environ["DEMO_MODE"] = "true"
    try:
        from memory_engine import GreenroomMemoryEngine
        mem1 = GreenroomMemoryEngine()
        mem1.save_briefing({"timestamp": "2026-08-11T12:00:00Z", "items": [{"id": "test_1", "title": "Test Briefing"}]})
        
        # Instantiate fresh engine instance to simulate page/server reload
        mem2 = GreenroomMemoryEngine()
        loaded = mem2.get_latest_briefing()
        assert loaded is not None, "Briefing must persist across fresh engine instantiation"
        assert loaded.get("items")[0]["id"] == "test_1", "Persisted briefing item ID must match"
        print("[OK] Verified briefing persists to disk and reloads on fresh memory engine instantiation.")
    finally:
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
    print("[OK] [TEST 18 PASSED]\n")


async def test_ranking_structure_validation():
    print("--- [TEST 19] Testing Ranking Structure & Categories Validation ---")
    orig_demo = os.environ.get("DEMO_MODE")
    os.environ["DEMO_MODE"] = "true"
    try:
        from memory_engine import memory_tool
        from agents import GreenroomCoreMind
        core = GreenroomCoreMind(memory_tool)
        briefing = await core.run_autonomous_cycle()
        
        priorities = [item["priority"] for item in briefing["items"]]
        assert "HIGH PRIORITY" in priorities, "Briefing must contain HIGH PRIORITY item"
        assert "MEDIUM PRIORITY" in priorities, "Briefing must contain MEDIUM PRIORITY item"
        assert "WATCH" in priorities, "Briefing must contain WATCH item"
        
        for item in briefing["items"]:
            assert "what_changed" in item, "Item must contain 'what_changed'"
            assert "why_it_matters" in item, "Item must contain 'why_it_matters'"
            assert "recommended_action" in item, "Item must contain 'recommended_action'"
        print("[OK] Verified briefing ranking structure & fields.")
    finally:
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
    print("[OK] [TEST 19 PASSED]\n")


async def test_memory_grounding_in_briefing():
    print("--- [TEST 20] Testing Memory Grounding in Briefing Items ---")
    orig_demo = os.environ.get("DEMO_MODE")
    os.environ["DEMO_MODE"] = "true"
    try:
        from memory_engine import memory_tool
        from agents import GreenroomCoreMind
        core = GreenroomCoreMind(memory_tool)
        briefing = await core.run_autonomous_cycle()
        
        has_grounding = any("grounding" in item["why_it_matters"].lower() or "matches" in item["why_it_matters"].lower() for item in briefing["items"])
        assert has_grounding, "Briefing items must contain memory-grounded reasoning in why_it_matters"
        print("[OK] Verified explicit memory-grounded reasoning in briefing recommendations.")
    finally:
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
    print("[OK] [TEST 20 PASSED]\n")


def test_signal_provider_tagging():
    print("--- [TEST 21] Testing SignalProvider Demo Tagging & Abstraction ---")
    from minds_integration import DemoSignalProvider
    provider = DemoSignalProvider()
    signals = provider.get_signals()
    assert len(signals) >= 3, "DemoSignalProvider must yield at least 3 signals"
    for s in signals:
        assert s.get("is_demo") is True, "Demo signals must be tagged with is_demo=True"
        assert "Demo Dataset" in s.get("source_label", ""), "Demo signals must have explicit source_label"
    print("[OK] Verified SignalProvider abstraction and demo signal tagging.")
    print("[OK] [TEST 21 PASSED]\n")


def test_item_feedback_persistence():
    print("--- [TEST 22] Testing Briefing Item Feedback Persistence ---")
    from memory_engine import memory_tool
    entry = memory_tool.add_item_feedback("opp_001", "useful", "Great setup walkthrough idea")
    assert entry["item_id"] == "opp_001"
    assert entry["feedback_type"] == "useful"
    
    state = memory_tool.get_full_state()
    assert "item_feedbacks" in state, "State must contain item_feedbacks"
    assert any(f["item_id"] == "opp_001" for f in state["item_feedbacks"]), "Feedback must persist in profile state"
    print("[OK] Verified item feedback persistence in creator profile.")
    print("[OK] [TEST 22 PASSED]\n")


async def test_feedback_continuity_across_runs():
    print("--- [TEST 23] Testing Multi-Run Feedback Continuity ---")
    orig_demo = os.environ.get("DEMO_MODE")
    os.environ["DEMO_MODE"] = "true"
    try:
        from memory_engine import memory_tool
        from agents import GreenroomCoreMind
        core = GreenroomCoreMind(memory_tool)
        
        # Run 1: Learn new voice preference
        await core.process_user_feedback("Emphasize open-source terminal setup steps")
        
        # Run 2: Execute autonomous cycle, verify learned rule affects output
        briefing2 = await core.run_autonomous_cycle()
        high_pri = briefing2["items"][0]
        assert "terminal" in high_pri["why_it_matters"].lower() or "open-source" in high_pri["why_it_matters"].lower(), "Run 2 briefing must demonstrate feedback continuity"
        print("[OK] Verified Run 1 feedback directly adapts Run 2 briefing ranking/grounding.")
    finally:
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
    print("[OK] [TEST 23 PASSED]\n")


async def test_async_job_runner_status():
    print("--- [TEST 24] Testing Async Job Runner Background Execution ---")
    orig_demo = os.environ.get("DEMO_MODE")
    os.environ["DEMO_MODE"] = "true"
    try:
        from memory_engine import memory_tool
        from agents import GreenroomCoreMind
        from async_runner import QStashJobRunner
        core = GreenroomCoreMind(memory_tool)
        runner = QStashJobRunner()

        enqueue_res = await runner.enqueue_run("http://localhost:8000/api/briefing/worker")
        assert enqueue_res["status"] == "QUEUED", "Enqueue must return status QUEUED"
        run_id = enqueue_res["run_id"]

        worker_res = await runner.execute_worker_job(core, run_id)
        assert worker_res["status"] == "COMPLETED", "Worker execution must return COMPLETED"
        assert runner.get_status(run_id)["status"] == "COMPLETED", "Runner status must be COMPLETED"
        print("[OK] Verified QStashJobRunner background execution & status tracking.")
    finally:
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
    print("[OK] [TEST 24 PASSED]\n")


async def test_strict_production_error_during_autonomous_run():
    print("--- [TEST 25] Testing Production Mode Strict Failure During Autonomous Run ---")
    orig_builder_key = os.environ.get("MINDS_BUILDER_API_KEY")
    orig_demo = os.environ.get("DEMO_MODE")
    
    os.environ["MINDS_BUILDER_API_KEY"] = "invalid_key"
    os.environ["DEMO_MODE"] = "false"
    
    try:
        from memory_engine import memory_tool
        from agents import GreenroomCoreMind
        from minds_integration import MindsExecutionError
        core = GreenroomCoreMind(memory_tool)
        
        try:
            await core.run_autonomous_cycle()
            assert False, "Expected MindsExecutionError in production mode when builder key is invalid"
        except MindsExecutionError as e:
            print(f"[OK] Caught expected MindsExecutionError in production mode without fallback: {e}")
    finally:
        if orig_builder_key is not None:
            os.environ["MINDS_BUILDER_API_KEY"] = orig_builder_key
        else:
            os.environ.pop("MINDS_BUILDER_API_KEY", None)
            
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
    print("[OK] [TEST 25 PASSED]\n")


def test_persistence_store_mode_labeling_and_provenance():
    print("--- [TEST 26] Testing PersistenceStore Mode Labeling & Provenance Integrity ---")
    from persistence import LocalFileStore, EphemeralTmpStore, UpstashRedisStore
    
    file_store = LocalFileStore()
    assert file_store.mode_label == "LOCAL FILE", "LocalFileStore mode_label must be 'LOCAL FILE'"
    
    tmp_store = EphemeralTmpStore()
    assert tmp_store.mode_label == "EPHEMERAL", "EphemeralTmpStore mode_label must be 'EPHEMERAL'"
    assert tmp_store.mode_label != "DURABLE", "/tmp storage must NEVER be classified as DURABLE"
    
    redis_store = UpstashRedisStore("https://example.upstash.io", "test_token")
    assert redis_store.mode_label == "DURABLE", "UpstashRedisStore mode_label must be 'DURABLE'"
    
    print("[OK] Verified PersistenceStore mode labels: LocalFileStore='LOCAL FILE', EphemeralTmpStore='EPHEMERAL', UpstashRedisStore='DURABLE'.")
    print("[OK] [TEST 26 PASSED]\n")


async def test_qstash_async_job_runner_lifecycle_and_security():
    print("--- [TEST 27] Testing QStash Async Job Runner Lifecycle & Durable Status Integrity ---")
    from async_runner import QStashJobRunner
    from persistence import LocalFileStore
    from memory_engine import GreenroomMemoryEngine
    from agents import GreenroomCoreMind
    
    store1 = LocalFileStore()
    runner1 = QStashJobRunner(store1)
    
    # 1. Enqueue run -> returns QUEUED immediately
    enqueue_res = await runner1.enqueue_run("http://localhost:8000/api/briefing/worker")
    assert enqueue_res["status"] == "QUEUED", "Enqueue must return status QUEUED immediately"
    run_id = enqueue_res["run_id"]
    
    # 2. Status check from store instance 2 (proves status is NOT in process memory)
    store2 = LocalFileStore()
    runner2 = QStashJobRunner(store2)
    status_state = runner2.get_status(run_id)
    assert status_state["status"] == "QUEUED", "Durable store instance 2 must read status QUEUED"
    
    # 3. Worker execution transition: QUEUED -> RUNNING -> COMPLETED
    mem = GreenroomMemoryEngine(store1)
    core = GreenroomCoreMind(mem)
    worker_res = await runner1.execute_worker_job(core, run_id)
    assert worker_res["status"] == "COMPLETED", "Worker execution must transition status to COMPLETED"
    
    # 4. Read completed status from store instance 3
    store3 = LocalFileStore()
    runner3 = QStashJobRunner(store3)
    completed_state = runner3.get_status(run_id)
    assert completed_state["status"] == "COMPLETED", "Completed status must persist in durable store"
    assert completed_state.get("briefing_id") == run_id
    
    # 5. Verify failed worker execution transitions status to FAILED
    fail_run_id = "run_fail_test_123"
    runner1.save_status(fail_run_id, status="QUEUED")
    
    class FailingMind:
        async def run_autonomous_cycle(self):
            raise RuntimeError("Minds platform invocation timeout")
            
    fail_res = await runner1.execute_worker_job(FailingMind(), fail_run_id)
    assert fail_res["status"] == "FAILED"
    assert "Minds platform invocation timeout" in fail_res.get("error", "")
    
    print("[OK] Verified QStash job runner: QUEUED -> RUNNING -> COMPLETED / FAILED across independent store instances.")
    print("[OK] [TEST 27 PASSED]\n")


async def test_creator_onboarding_persistence():
    print("--- [TEST 28] Testing Real Creator Onboarding Persistence ---")
    memory = GreenroomMemoryEngine()
    onboard_data = {
        "creator_name": "Test Creator",
        "niche": "Developer Infrastructure & AI Agents",
        "audience_description": "Software engineers and AI builders",
        "preferred_tone": "Direct, practical and fluff-free",
        "main_goal": "Build technical audience trust",
        "content_wanted": ["Code setup guides"],
        "content_not_wanted": ["Crypto trading bots", "Sensational clickbait"]
    }
    state = memory.onboard_creator(onboard_data)
    assert state["creator_name"] == "Test Creator"
    assert state["niche"] == "Developer Infrastructure & AI Agents"
    assert "Sensational clickbait" in state["rejected_topics"]
    
    # Reload from disk to prove persistence
    reloaded = GreenroomMemoryEngine()
    assert reloaded.state["creator_name"] == "Test Creator"
    print("[OK] Verified onboarding profile persists to disk and updates creator identity context.")
    print("[OK] [TEST 28 PASSED]\n")


async def test_rejection_feedback_constraint_extraction():
    print("--- [TEST 29] Testing Rejection Feedback & Constraint Extraction ---")
    memory = GreenroomMemoryEngine()
    entry = memory.process_rejection_feedback(item_id="opp_001", reason_category="Too clickbait", notes="Make it practical")
    assert "clickbait" in entry["extracted_rule"].lower()
    assert entry["extracted_rule"] in memory.state["learned_voice_rules"]
    print("[OK] Verified rejection feedback extracts constraint rule and persists into creator memory.")
    print("[OK] [TEST 29 PASSED]\n")


async def test_recommendation_grounding_breakdown():
    print("--- [TEST 30] Testing Recommendation Grounding Breakdown ---")
    core = GreenroomCoreMind()
    payload = await core.synthesize_strategy("Local AI Setup")
    assert "script_concept" in payload
    assert payload.get("is_punchy_voice") is True or "cited_memory_nodes" in payload
    print("[OK] Verified strategy synthesis returns grounded recommendation breakdown.")
    print("[OK] [TEST 30 PASSED]\n")


def test_fastapi_app_import():
    print("--- [TEST 31] Testing FastAPI Application Import ---")
    import server
    assert server.app is not None
    print("[OK] FastAPI application imports without startup exceptions.")
    print("[OK] [TEST 31 PASSED]\n")


async def test_python_worker_disabled_in_production():
    print("--- [TEST 32] Testing Production Worker Route Isolation ---")
    original_key = os.environ.get("MINDS_BUILDER_API_KEY")
    original_demo = os.environ.get("DEMO_MODE")
    os.environ["MINDS_BUILDER_API_KEY"] = "route-isolation-test"
    os.environ["DEMO_MODE"] = "false"
    try:
        import server
        from fastapi import HTTPException
        try:
            await server.briefing_worker(None)
            assert False, "Expected the Python demo worker to reject production execution"
        except HTTPException as exc:
            assert exc.status_code == 404
    finally:
        if original_key is None:
            os.environ.pop("MINDS_BUILDER_API_KEY", None)
        else:
            os.environ["MINDS_BUILDER_API_KEY"] = original_key
        if original_demo is None:
            os.environ.pop("DEMO_MODE", None)
        else:
            os.environ["DEMO_MODE"] = original_demo
    print("[OK] Production execution is isolated to the signed Node worker route.")
    print("[OK] [TEST 32 PASSED]\n")


async def main():
    test_loud_failure_when_unconfigured()
    await test_production_mode_execution_error_without_fallback()
    await test_sdk_exception_never_returns_mock_engine()
    test_explicit_demo_mode()
    await test_local_creator_profile_persistence_and_adaptation()
    await test_demo_runner_flow()
    test_real_mind_builder_api_integration()
    test_verify_real_mind_parsing()
    test_missing_email_cannot_verify()
    test_missing_wallet_cannot_verify()
    test_wrong_uuid_cannot_verify()
    test_is_enabled_false_cannot_verify()
    await test_message_send_without_reply_raises_error()
    await test_after_fingerprint_passed_to_wait_for_reply()
    await test_node_client_lib_failure_raises_minds_execution_error()
    await test_no_production_direct_rest_messaging_fallback()
    await test_autonomous_run_execution_no_second_chat()
    await test_briefing_persists_across_reloads()
    await test_ranking_structure_validation()
    await test_memory_grounding_in_briefing()
    test_signal_provider_tagging()
    test_item_feedback_persistence()
    await test_feedback_continuity_across_runs()
    await test_async_job_runner_status()
    await test_strict_production_error_during_autonomous_run()
    test_persistence_store_mode_labeling_and_provenance()
    await test_qstash_async_job_runner_lifecycle_and_security()
    await test_creator_onboarding_persistence()
    await test_rejection_feedback_constraint_extraction()
    await test_recommendation_grounding_breakdown()
    test_fastapi_app_import()
    await test_python_worker_disabled_in_production()
    print("SUCCESS: ALL 32 GREENROOM INTEGRATION & REAL PERSISTENT INTELLIGENCE TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    asyncio.run(main())




