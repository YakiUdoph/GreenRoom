import asyncio
import json
import time
from typing import Dict, List, Any, Optional
from memory_engine import memory_tool
from imp_protocol import imp_bus
from minds_integration import minds_manager
from agents import GreenroomCoreMind, ScoutMind, CommunityMind, BusinessMind

class GreenroomDemoRunner:
    """Orchestrates the 5-Minute Hackathon Demo Sequence over Minds SDK Agents"""
    def __init__(self):
        self.memory = memory_tool
        self.core = GreenroomCoreMind(self.memory)
        self.scout = ScoutMind(self.memory)
        self.community = CommunityMind(self.memory)
        self.business = BusinessMind(self.memory)

    async def run_minute_1(self) -> Dict[str, Any]:
        """Minute 1: Zero-State Profile Ingestion & Minds Memory Node Creation"""
        raw_artifact = {
            "creator_name": "Alex Rivera",
            "brand_voice_attributes": [
                "Educational",
                "Technical yet accessible",
                "Direct and energetic",
                "Data-driven storytelling"
            ],
            "content": "Past video script analysis: 'Build a Custom AI Agent in 10 Mins'. Viewer retention: 78% at 30 seconds. Audience requests github links and setup walkthroughs.",
            "insights": [
                "Step-by-step technical overviews drive 3x audience retention compared to news recaps.",
                "High engagement on code repository links."
            ],
            "rejected_topics": ["Crypto trading bots", "Generic AI news clickbait"],
            "monetization_benchmarks": {"cpm_target": 45, "minimum_deal_size": 5000}
        }
        res = await self.core.ingest_profile_artifact("video_script_analytics", raw_artifact)
        return {
            "minute": 1,
            "title": "Zero-State Profile Ingestion",
            "result": res,
            "minds_status": minds_manager.get_status(),
            "profile_snapshot": self.memory.get_full_state()
        }

    async def run_minute_2(self) -> Dict[str, Any]:
        """Minute 2: Autonomous Trend Filtering (Scout Mind via Minds Skill)"""
        trends = await self.scout.scan_and_filter_trends()
        return {
            "minute": 2,
            "title": "Autonomous Trend Filtering",
            "recommended_trends": trends,
            "total_evaluated": len(trends),
            "minds_status": minds_manager.get_status()
        }

    async def run_minute_3(self) -> Dict[str, Any]:
        """Minute 3: Multi-Mind Strategy Synthesis (Community & Core Minds)"""
        # Step 3a: Fetch audience signals via Community Mind
        audience_insight = await self.community.analyze_audience_signals()
        # Step 3b: Core Mind synthesizes script concept using Minds agent memory
        strategy = await self.core.synthesize_strategy("Beginner AI Workflows & Automation")
        
        return {
            "minute": 3,
            "title": "Multi-Mind Strategy Synthesis",
            "audience_insight": audience_insight,
            "strategy": strategy,
            "minds_status": minds_manager.get_status()
        }

    async def run_minute_4(self) -> Dict[str, Any]:
        """Minute 4: Autonomous Business Execution (Business Mind via Minds Skill)"""
        pitch = await self.business.generate_sponsor_pitch("TechBrand Inc.")
        return {
            "minute": 4,
            "title": "Autonomous Business Execution",
            "pitch_proposal": pitch,
            "minds_status": minds_manager.get_status()
        }

    async def run_minute_5(self, custom_feedback: Optional[str] = None) -> Dict[str, Any]:
        """Minute 5: Proof of Learning ('The Magic Moment' - Minds Context Persistence)"""
        feedback = custom_feedback or "Too formal. Make it punchier and emphasize beginner-friendly tips."
        learning_result = await self.core.process_user_feedback(feedback)
        
        return {
            "minute": 5,
            "title": "Proof of Learning ('The Magic Moment')",
            "user_feedback": feedback,
            "learning_result": learning_result,
            "updated_profile_rules": self.memory.get_full_state().get("learned_voice_rules", []),
            "minds_status": minds_manager.get_status()
        }

    async def run_full_demo(self) -> List[Dict[str, Any]]:
        """Run full 5-minute hackathon demo sequence continuously over Minds SDK layer"""
        results = []
        results.append(await self.run_minute_1())
        await asyncio.sleep(0.3)
        results.append(await self.run_minute_2())
        await asyncio.sleep(0.3)
        results.append(await self.run_minute_3())
        await asyncio.sleep(0.3)
        results.append(await self.run_minute_4())
        await asyncio.sleep(0.3)
        results.append(await self.run_minute_5())
        return results

demo_runner_tool = GreenroomDemoRunner()
