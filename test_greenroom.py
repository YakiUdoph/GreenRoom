import asyncio
import json
import os
import sys

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
        assert status["mode"] in ("demo", "[MOCK DEMO MODE]")
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


async def main():
    test_loud_failure_when_unconfigured()
    await test_production_mode_execution_error_without_fallback()
    await test_sdk_exception_never_returns_mock_engine()
    test_explicit_demo_mode()
    await test_local_creator_profile_persistence_and_adaptation()
    await test_demo_runner_flow()
    test_real_mind_builder_api_integration()
    test_verify_real_mind_parsing()
    print("SUCCESS: ALL GREENROOM INTEGRATION & COMPLIANCE TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    asyncio.run(main())
