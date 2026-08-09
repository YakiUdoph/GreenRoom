import asyncio
import json
import os
import sys

def test_memory_engine():
    print("--- [TEST 1] Testing GreenroomMemoryEngine ---")
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

    # Retrieve context
    relevant = mem.retrieve_relevant_context("technical overview step-by-step")
    assert len(relevant) > 0
    print(f"[OK] Retrieved {len(relevant)} relevant context nodes.")

    # Add learned rule
    mem.add_learned_voice_rule("Avoid overly formal phrasing; keep tone punchy")
    state = mem.get_full_state()
    assert "Avoid overly formal phrasing; keep tone punchy" in state["learned_voice_rules"]
    print("[OK] Added learned voice rule to persistent state.")

    # Cleanup test profile
    if os.path.exists("test_creator_profile.json"):
        os.remove("test_creator_profile.json")
    print("[OK] [TEST 1 PASSED]\n")


def test_imp_protocol():
    print("--- [TEST 2] Testing Inter-Mind Protocol (IMP) ---")
    from imp_protocol import IMPMessage, imp_bus
    
    msg = IMPMessage(
        sender_mind="ScoutMind",
        target_mind="GreenroomCore",
        action_type="FLAG_TREND",
        confidence_score=0.92,
        payload={"trend_name": "Beginner AI Workflows"}
    )
    d = msg.to_dict()
    assert d["protocol_version"] == "1.0"
    assert d["sender_mind"] == "ScoutMind"
    assert d["action_type"] == "FLAG_TREND"
    print("[OK] IMP message serialization verified.")
    print("[OK] [TEST 2 PASSED]\n")


async def test_demo_runner():
    print("--- [TEST 3] Testing 5-Minute Demo Runner Workflow ---")
    from demo_runner import GreenroomDemoRunner
    from memory_engine import memory_tool

    # Reset memory tool
    memory_tool.reset_state()

    runner = GreenroomDemoRunner()

    # Minute 1: Zero-State Profile Ingestion
    min1 = await runner.run_minute_1()
    assert min1["minute"] == 1
    print("[OK] Minute 1 (Zero-State Ingestion) executed clean.")

    # Minute 2: Autonomous Trend Filtering
    min2 = await runner.run_minute_2()
    assert min2["minute"] == 2
    assert len(min2["recommended_trends"]) > 0
    print(f"[OK] Minute 2 (Trend Filtering) executed clean. Recommended: {min2['recommended_trends'][0]['trend_name']}")

    # Minute 3: Strategy Synthesis
    min3 = await runner.run_minute_3()
    assert min3["minute"] == 3
    assert "script_concept" in min3["strategy"]
    print("[OK] Minute 3 (Multi-Mind Strategy Synthesis) executed clean.")

    # Minute 4: Autonomous Business Execution
    min4 = await runner.run_minute_4()
    assert min4["minute"] == 4
    assert min4["pitch_proposal"]["match_score"] == 0.89
    print("[OK] Minute 4 (Autonomous Business Execution) executed clean.")

    # Minute 5: Proof of Learning ("The Magic Moment")
    min5 = await runner.run_minute_5("Too formal. Make it punchier and emphasize beginner-friendly tips.")
    assert min5["minute"] == 5
    assert len(min5["updated_profile_rules"]) > 0
    print(f"[OK] Minute 5 (Proof of Learning) executed clean! Updated rules: {min5['updated_profile_rules']}")

    # Verify that subsequent strategy calls automatically apply punchy voice rule
    strat2 = await runner.core.synthesize_strategy("Beginner AI Workflows & Automation")
    assert strat2["is_punchy_voice"] is True
    print("[OK] [VERIFIED] Subsequent runs automatically reflect learned voice rules in creator_profile.json!")

    print("[OK] [TEST 3 PASSED]\n")


async def main():
    test_memory_engine()
    test_imp_protocol()
    await test_demo_runner()
    print("SUCCESS: ALL GREENROOM AUTOMATED TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
