import asyncio
import json
import os
import sys


def test_loud_failure_when_unconfigured():
    print("--- [TEST 1] Testing Loud Failure when Unconfigured ---")
    # Backup env vars
    orig_key = os.environ.pop("MINDS_API_KEY", None)
    orig_demo = os.environ.pop("DEMO_MODE", None)
    
    try:
        from minds_integration import GreenroomMindsIntegrationManager, MindsConfigurationError
        mgr = GreenroomMindsIntegrationManager()
        
        # Must fail loudly when validating configuration or fetching agent
        try:
            mgr.validate_configuration()
            assert False, "Expected MindsConfigurationError when MINDS_API_KEY is missing and DEMO_MODE is not true."
        except MindsConfigurationError as e:
            print(f"[OK] Caught expected loud failure exception: {e}")
            
    finally:
        if orig_key is not None:
            os.environ["MINDS_API_KEY"] = orig_key
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
    print("[OK] [TEST 1 PASSED]\n")


def test_explicit_demo_mode():
    print("--- [TEST 2] Testing Explicit DEMO_MODE=true Labeling ---")
    orig_demo = os.environ.get("DEMO_MODE")
    os.environ["DEMO_MODE"] = "true"
    
    try:
        from minds_integration import GreenroomMindsIntegrationManager
        mgr = GreenroomMindsIntegrationManager()
        status = mgr.get_status()
        
        assert status["demo_mode_active"] is True
        assert status["mode"] == "[MOCK DEMO MODE]"
        print(f"[OK] Status mode correctly labeled: {status['mode']}")
        
        # Test agent execution in explicitly labeled mock mode
        agent = mgr.get_agent("ScoutMind")
        assert agent.is_mock_mode is True
        print("[OK] ScoutMind explicitly tagged with is_mock_mode=True.")
        
    finally:
        if orig_demo is not None:
            os.environ["DEMO_MODE"] = orig_demo
        else:
            os.environ.pop("DEMO_MODE", None)
            
    print("[OK] [TEST 2 PASSED]\n")


def test_memory_engine_and_persistence():
    print("--- [TEST 3] Testing Persistent Memory Engine & Minds Sync ---")
    os.environ["DEMO_MODE"] = "true"
    from memory_engine import GreenroomMemoryEngine
    
    mem = GreenroomMemoryEngine("test_creator_profile.json")
    mem.reset_state()
    
    # Ingest artifact
    node = mem.ingest_creator_artifact("analytics_summary", {
        "content": "Audience retention spikes 3x on step-by-step technical overviews.",
        "insights": ["Step-by-step wins"]
    })
    assert node["node_id"].startswith("mem_")
    print("[OK] Ingested creator artifact successfully.")

    # Add learned rule
    mem.add_learned_voice_rule("Avoid overly formal phrasing; keep tone punchy")
    state = mem.get_full_state()
    assert "Avoid overly formal phrasing; keep tone punchy" in state["learned_voice_rules"]
    print("[OK] Verified learned rule persisted in creator_profile.json.")

    if os.path.exists("test_creator_profile.json"):
        os.remove("test_creator_profile.json")
    print("[OK] [TEST 3 PASSED]\n")


async def test_demo_runner_flow():
    print("--- [TEST 4] Testing 5-Minute Demo Runner Workflow ---")
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
    assert min4["pitch_proposal"]["match_score"] == 0.89
    print("[OK] Minute 4 executed clean.")

    min5 = await runner.run_minute_5("Too formal. Make it punchier and emphasize beginner-friendly tips.")
    assert min5["minute"] == 5
    assert len(min5["updated_profile_rules"]) > 0
    print(f"[OK] Minute 5 executed clean! Updated rules: {min5['updated_profile_rules']}")

    print("[OK] [TEST 4 PASSED]\n")


async def main():
    test_loud_failure_when_unconfigured()
    test_explicit_demo_mode()
    test_memory_engine_and_persistence()
    await test_demo_runner_flow()
    print("SUCCESS: ALL GREENROOM TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    asyncio.run(main())
