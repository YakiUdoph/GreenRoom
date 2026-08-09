import asyncio
import json
import os
import sys

def test_minds_sdk_integration():
    print("--- [TEST 1] Testing Minds SDK Integration Layer ---")
    from minds_integration import minds_manager
    
    status = minds_manager.get_status()
    assert "active_minds_agents" in status
    assert len(status["active_minds_agents"]) == 4
    
    agents = [a["name"] for a in status["active_minds_agents"]]
    print(f"[OK] Instantiated 4 Minds Agents: {agents}")
    
    # Test registered skill execution on Scout Mind
    scout_agent = minds_manager.get_agent("ScoutMind")
    assert "search_trends" in scout_agent.skills
    print("[OK] Verified registered skill 'search_trends' on Scout Mind.")
    
    # Test registered skill execution on Community Mind
    community_agent = minds_manager.get_agent("CommunityMind")
    assert "analyze_comments" in community_agent.skills
    print("[OK] Verified registered skill 'analyze_comments' on Community Mind.")
    
    # Test registered skill execution on Business Mind
    business_agent = minds_manager.get_agent("BusinessMind")
    assert "score_deal" in business_agent.skills
    print("[OK] Verified registered skill 'score_deal' on Business Mind.")
    
    print("[OK] [TEST 1 PASSED]\n")


def test_memory_engine_and_minds_persistence():
    print("--- [TEST 2] Testing Persistent Memory Engine & Minds State Sync ---")
    from memory_engine import GreenroomMemoryEngine
    from minds_integration import minds_manager
    
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

    # Add learned rule and verify Minds SDK persistence
    mem.add_learned_voice_rule("Avoid overly formal phrasing; keep tone punchy")
    state = mem.get_full_state()
    assert "Avoid overly formal phrasing; keep tone punchy" in state["learned_voice_rules"]
    
    # Verify Minds agents received learned rule in native context
    core_agent = minds_manager.get_agent("GreenroomCore")
    assert "Avoid overly formal phrasing; keep tone punchy" in core_agent.learned_rules
    print("[OK] Verified learned rule persisted in both local profile and Minds SDK agent state.")

    # Cleanup test profile
    if os.path.exists("test_creator_profile.json"):
        os.remove("test_creator_profile.json")
    print("[OK] [TEST 2 PASSED]\n")


def test_imp_protocol():
    print("--- [TEST 3] Testing Inter-Mind Protocol (IMP) ---")
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
    print("[OK] [TEST 3 PASSED]\n")


async def test_demo_runner():
    print("--- [TEST 4] Testing 5-Minute Demo Runner Workflow (Minds-Powered) ---")
    from demo_runner import GreenroomDemoRunner
    from memory_engine import memory_tool
    from minds_integration import minds_manager

    # Reset memory tool
    memory_tool.reset_state()

    runner = GreenroomDemoRunner()

    # Minute 1: Zero-State Profile Ingestion
    min1 = await runner.run_minute_1()
    assert min1["minute"] == 1
    print("[OK] Minute 1 (Zero-State Ingestion) executed clean.")

    # Minute 2: Autonomous Trend Filtering via Minds Skill
    min2 = await runner.run_minute_2()
    assert min2["minute"] == 2
    assert len(min2["recommended_trends"]) > 0
    print(f"[OK] Minute 2 (Trend Filtering) executed clean. Recommended: {min2['recommended_trends'][0]['trend_name']}")

    # Minute 3: Strategy Synthesis
    min3 = await runner.run_minute_3()
    assert min3["minute"] == 3
    assert "script_concept" in min3["strategy"]
    print("[OK] Minute 3 (Multi-Mind Strategy Synthesis) executed clean.")

    # Minute 4: Autonomous Business Execution via Minds Skill
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
    print("[OK] [VERIFIED] Subsequent runs automatically reflect learned voice rules in creator_profile.json & Minds SDK state!")

    print("[OK] [TEST 4 PASSED]\n")


async def main():
    test_minds_sdk_integration()
    test_memory_engine_and_minds_persistence()
    test_imp_protocol()
    await test_demo_runner()
    print("SUCCESS: ALL GREENROOM AUTOMATED TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    asyncio.run(main())
