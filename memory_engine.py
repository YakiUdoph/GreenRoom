import json
import time
import os
from typing import Dict, List, Any, Optional

class GreenroomMemoryEngine:
    def __init__(self, profile_path: str = "creator_profile.json"):
        self.profile_path = profile_path
        self.state = self._load_profile()

    def _load_profile(self) -> Dict[str, Any]:
        if os.path.exists(self.profile_path):
            try:
                with open(self.profile_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[MemoryEngine] Error loading profile from {self.profile_path}: {e}")
        
        # Default state fallback
        return {
            "creator_name": "Alex Rivera",
            "brand_voice_attributes": ["Educational", "Technical yet accessible", "Direct"],
            "content_performance_history": [],
            "audience_demographics": {},
            "rejected_topics": ["Crypto trading bots", "Generic clickbait"],
            "monetization_benchmarks": {"cpm_target": 45},
            "learned_voice_rules": [],
            "memory_nodes": []
        }

    def save_state(self) -> None:
        with open(self.profile_path, "w", encoding="utf-8") as f:
            json.dump(self.state, f, indent=2)

    def retrieve_relevant_context(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Calculates context relevance using keyword-semantic scoring & recency decay.
        """
        scored_nodes = []
        current_time = time.time()
        query_words = set(query.lower().split())
        
        for node in self.state.get("memory_nodes", []):
            recency_hours = (current_time - node.get("timestamp", current_time)) / 3600.0
            recency_decay = max(0.5, 1.0 - (recency_hours / 720.0)) # Decays over 30 days
            
            # Simple keyword match relevance (boosted by word matches in content & takeaways)
            content_text = (node.get("content", "") + " " + " ".join(node.get("key_takeaways", []))).lower()
            matches = sum(1 for word in query_words if word in content_text)
            
            base_score = matches / (len(query_words) + 1.0)
            final_score = base_score * recency_decay
            scored_nodes.append((final_score, node))
            
        scored_nodes.sort(key=lambda x: x[0], reverse=True)
        return [node for score, node in scored_nodes[:top_k]]

    def get_formatted_memory_context(self, query: str = "") -> str:
        """
        Formats state and memory nodes into a clean context string for system prompt injection.
        """
        relevant = self.retrieve_relevant_context(query) if query else self.state.get("memory_nodes", [])[:3]
        
        rules = self.state.get("learned_voice_rules", [])
        rules_str = "\n".join([f"- {r}" for r in rules]) if rules else "- Default brand voice parameters active"
        
        nodes_str = "\n".join([
            f"* [{n.get('type', 'general').upper()}] {n.get('content', '')}" 
            for n in relevant
        ]) if relevant else "No prior specific memory nodes."

        return f"LEARNED VOICE RULES:\n{rules_str}\n\nRELEVANT MEMORY NODES:\n{nodes_str}"

    def ingest_creator_artifact(self, artifact_type: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses raw content performance, past scripts, or user preferences into persistent memory state.
        """
        new_node = {
            "node_id": f"mem_{int(time.time()*1000)}",
            "type": artifact_type,
            "timestamp": time.time(),
            "content": raw_data.get("content", json.dumps(raw_data)),
            "key_takeaways": raw_data.get("insights", raw_data.get("takeaways", []))
        }
        self.state.setdefault("memory_nodes", []).append(new_node)
        
        # If artifact contains profile updates, merge them
        if "creator_name" in raw_data:
            self.state["creator_name"] = raw_data["creator_name"]
        if "brand_voice_attributes" in raw_data:
            self.state["brand_voice_attributes"] = raw_data["brand_voice_attributes"]
        if "rejected_topics" in raw_data:
            for t in raw_data["rejected_topics"]:
                if t not in self.state["rejected_topics"]:
                    self.state["rejected_topics"].append(t)
        if "monetization_benchmarks" in raw_data:
            self.state["monetization_benchmarks"].update(raw_data["monetization_benchmarks"])

        self.save_state()
        return new_node

    def add_learned_voice_rule(self, rule: str) -> None:
        """
        Appends a newly learned rule (e.g. from Minute 5 user feedback) to persistent state.
        """
        rules = self.state.setdefault("learned_voice_rules", [])
        if rule not in rules:
            rules.append(rule)
        
        # Also ingest as a high-priority memory node
        self.ingest_creator_artifact(
            artifact_type="learned_preference",
            raw_data={
                "content": f"User Feedback Rule: {rule}",
                "insights": ["Explicit creator override on voice & tone", rule]
            }
        )
        self.save_state()

    def get_full_state(self) -> Dict[str, Any]:
        return self.state

    def reset_state(self, seed_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if seed_data:
            self.state = seed_data
        else:
            self.state = {
                "creator_name": "Alex Rivera",
                "brand_voice_attributes": ["Educational", "Technical yet accessible", "Direct"],
                "content_performance_history": [],
                "audience_demographics": {"primary_age": "22-35"},
                "rejected_topics": ["Crypto trading bots", "Generic AI news clickbait"],
                "monetization_benchmarks": {"cpm_target": 45, "minimum_deal_size": 5000},
                "learned_voice_rules": [],
                "memory_nodes": []
            }
        self.save_state()
        return self.state

# Expose global singleton instance
memory_tool = GreenroomMemoryEngine()
