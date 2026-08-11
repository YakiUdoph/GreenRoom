import json
import time
import os
from typing import Dict, List, Any, Optional
from minds_integration import minds_manager

class GreenroomMemoryEngine:
    """
    Persistent Memory Engine for Greenroom.
    Manages creator profile history, context relevance scoring with 720h recency decay,
    and synchronizes persistent rules with the remote Minds API agent context.
    """
    def __init__(self, profile_path: str = "creator_profile.json"):
        self.profile_path = profile_path
        self.state = self._load_profile()
        self._sync_to_minds_sdk()

    def _load_profile(self) -> Dict[str, Any]:
        for target in ["/tmp/creator_profile.json", self.profile_path]:
            if os.path.exists(target):
                try:
                    with open(target, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception as e:
                    print(f"[MemoryEngine] Error loading profile from {target}: {e}")
        
        return {
            "creator_name": "Alex Rivera",
            "brand_voice_attributes": ["Educational", "Technical yet accessible", "Direct"],
            "content_performance_history": [],
            "audience_demographics": {},
            "rejected_topics": ["Crypto trading bots", "Generic AI news clickbait"],
            "monetization_benchmarks": {"cpm_target": 45},
            "learned_voice_rules": [],
            "memory_nodes": []
        }

    def _sync_to_minds_sdk(self):
        """Syncs stored learned voice rules with Minds agent instances when configured"""
        try:
            minds_manager.clear_learned_preferences()
            for rule in self.state.get("learned_voice_rules", []):
                minds_manager.update_learned_preference(rule)
        except Exception:
            pass

    def save_state(self) -> None:
        try:
            with open(self.profile_path, "w", encoding="utf-8") as f:
                json.dump(self.state, f, indent=2)
        except (PermissionError, OSError) as e:
            try:
                tmp_path = "/tmp/creator_profile.json"
                with open(tmp_path, "w", encoding="utf-8") as f:
                    json.dump(self.state, f, indent=2)
            except Exception as tmp_err:
                print(f"[MemoryEngine] Warning: persistent save skipped on serverless env: {tmp_err}")

    def retrieve_relevant_context(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        scored_nodes = []
        current_time = time.time()
        query_words = set(query.lower().split())
        
        for node in self.state.get("memory_nodes", []):
            recency_hours = (current_time - node.get("timestamp", current_time)) / 3600.0
            recency_decay = max(0.5, 1.0 - (recency_hours / 720.0))
            
            content_text = (node.get("content", "") + " " + " ".join(node.get("key_takeaways", []))).lower()
            matches = sum(1 for word in query_words if word in content_text)
            
            base_score = matches / (len(query_words) + 1.0)
            final_score = base_score * recency_decay
            scored_nodes.append((final_score, node))
            
        scored_nodes.sort(key=lambda x: x[0], reverse=True)
        return [node for score, node in scored_nodes[:top_k]]

    def get_formatted_memory_context(self, query: str = "") -> str:
        relevant = self.retrieve_relevant_context(query) if query else self.state.get("memory_nodes", [])[:3]
        
        rules = self.state.get("learned_voice_rules", [])
        rules_str = "\n".join([f"- {r}" for r in rules]) if rules else "- Default brand voice parameters active"
        
        nodes_str = "\n".join([
            f"* [{n.get('type', 'general').upper()}] {n.get('content', '')}" 
            for n in relevant
        ]) if relevant else "No prior specific memory nodes."

        return f"LEARNED VOICE RULES:\n{rules_str}\n\nRELEVANT MEMORY NODES:\n{nodes_str}"

    def ingest_creator_artifact(self, artifact_type: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        new_node = {
            "node_id": f"mem_{int(time.time()*1000)}",
            "type": artifact_type,
            "timestamp": time.time(),
            "content": raw_data.get("content", json.dumps(raw_data)),
            "key_takeaways": raw_data.get("insights", raw_data.get("takeaways", []))
        }
        self.state.setdefault("memory_nodes", []).append(new_node)
        
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

    def save_briefing(self, briefing: Dict[str, Any]) -> None:
        self.state["latest_briefing"] = briefing
        self.state.setdefault("briefing_history", []).append(briefing)
        # Keep last 10 briefings
        if len(self.state["briefing_history"]) > 10:
            self.state["briefing_history"] = self.state["briefing_history"][-10:]
        
        self.save_state()
        # Also write standalone briefing file for easy inspection/recovery
        for path in ["latest_briefing.json", "/tmp/latest_briefing.json"]:
            try:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(briefing, f, indent=2)
            except Exception:
                pass

    def get_latest_briefing(self) -> Optional[Dict[str, Any]]:
        if "latest_briefing" in self.state and self.state["latest_briefing"]:
            return self.state["latest_briefing"]
        
        for path in ["latest_briefing.json", "/tmp/latest_briefing.json"]:
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if data:
                            self.state["latest_briefing"] = data
                            return data
                except Exception:
                    pass
        return None

    def add_item_feedback(self, item_id: str, feedback_type: str, notes: Optional[str] = None) -> Dict[str, Any]:
        """
        Record feedback on a briefing opportunity item (useful, not_useful, done, dismiss).
        Persists into creator memory to influence future autonomous ranking cycles.
        """
        feedbacks = self.state.setdefault("item_feedbacks", [])
        entry = {
            "item_id": item_id,
            "feedback_type": feedback_type,  # useful, not_useful, done, dismiss
            "timestamp": time.time(),
            "notes": notes
        }
        feedbacks.append(entry)

        # If user explicitly marked item as useful or dismiss, persist as voice/preference rule
        if feedback_type == "useful":
            rule_str = f"Creator prefers opportunities matching item '{item_id}'"
            self.add_learned_voice_rule(rule_str)
        elif feedback_type in ("not_useful", "dismiss"):
            rule_str = f"Creator rejected opportunity format in item '{item_id}'"
            self.add_learned_voice_rule(rule_str)

        self.save_state()
        return entry

    def add_learned_voice_rule(self, rule: str) -> None:
        rules = self.state.setdefault("learned_voice_rules", [])
        if rule not in rules:
            rules.append(rule)
        
        self.ingest_creator_artifact(
            artifact_type="learned_preference",
            raw_data={
                "content": f"User Feedback Rule: {rule}",
                "insights": ["Explicit creator override on voice & tone", rule]
            }
        )
        
        try:
            minds_manager.update_learned_preference(rule)
        except Exception:
            pass
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
        self._sync_to_minds_sdk()
        return self.state

memory_tool = GreenroomMemoryEngine()
