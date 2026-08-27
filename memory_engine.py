import json
import time
import os
from typing import Dict, List, Any, Optional
from minds_integration import minds_manager
from persistence import get_persistence_store, PersistenceStore

HIGH_CONFIDENCE_MEMORY_NOISE = {
    "hi",
    "hello",
    "thanks",
    "okay",
    "test",
    "what can you do",
    "what does greenroom know about me that survives between sessions",
}

PREFERENCE_SIGNALS = (
    "i prefer ", "prefer ", "please keep ", "keep ", "use ",
    "avoid ", "do not ", "don't ", "never ", "always ", "only ",
    "prioritize ", "favour ", "favor ", "i need ", "i want ",
    "my budget ", "my workflow ", "my style ", "my audience ",
)


def _normalized_memory_text(text: str) -> str:
    return " ".join(text.strip().lower().rstrip(".!?").split())


def is_meaningful_creator_preference(text: str) -> bool:
    """Conservatively accept explicit, reusable creator context only."""
    if not isinstance(text, str):
        return False
    cleaned = _normalized_memory_text(text)
    if cleaned in HIGH_CONFIDENCE_MEMORY_NOISE or len(cleaned.split()) < 3:
        return False
    if text.strip().endswith("?"):
        return False
    return any(signal in f" {cleaned} " for signal in PREFERENCE_SIGNALS)

class GreenroomMemoryEngine:
    """
    Persistent Memory Engine for Greenroom.
    Delegates to PersistenceStore abstraction (LocalFileStore, EphemeralTmpStore, or UpstashRedisStore).
    """
    def __init__(self, store: Optional[PersistenceStore] = None):
        self.store = store or get_persistence_store()
        self.state = self.store.get_creator_profile()
        self.historical_noise_removed = self.clean_historical_noise()
        self._sync_to_minds_sdk()

    @property
    def persistence_mode(self) -> str:
        return self.store.mode_label

    def _sync_to_minds_sdk(self):
        """Syncs stored learned voice rules with Minds agent instances when configured"""
        try:
            minds_manager.clear_learned_preferences()
            for rule in self.state.get("learned_voice_rules", []):
                minds_manager.update_learned_preference(rule)
        except Exception:
            pass

    def save_state(self) -> None:
        self.store.save_creator_profile(self.state)

    def reload_state(self) -> Dict[str, Any]:
        """Refresh this engine instance from the configured persistence store."""
        self.state = self.store.get_creator_profile()
        self.historical_noise_removed = self.clean_historical_noise()
        return self.state

    def clean_historical_noise(self) -> List[str]:
        """Remove only exact, high-confidence historical noise entries."""
        rules = self.state.get("learned_voice_rules", [])
        removed = []

        def is_known_noise(value: Any) -> bool:
            if not isinstance(value, str):
                return False
            candidate = value
            if candidate.startswith("User Feedback Rule: "):
                candidate = candidate[len("User Feedback Rule: "):]
            if _normalized_memory_text(candidate) in HIGH_CONFIDENCE_MEMORY_NOISE:
                removed.append(candidate.strip())
                return True
            return False

        cleaned_rules = [rule for rule in rules if not is_known_noise(rule)]

        nodes = self.state.get("memory_nodes", [])
        cleaned_nodes = []
        for node in nodes:
            content = node.get("content", "")
            if node.get("type") == "learned_preference":
                pref_text = content
                if content.startswith("User Feedback Rule: "):
                    pref_text = content[len("User Feedback Rule: "):]
                if is_known_noise(pref_text):
                    continue
            cleaned_nodes.append(node)

        if len(cleaned_rules) != len(rules) or len(cleaned_nodes) != len(nodes):
            self.state["learned_voice_rules"] = cleaned_rules
            self.state["memory_nodes"] = cleaned_nodes
            self.save_state()
        return list(dict.fromkeys(removed))


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
        if len(self.state["briefing_history"]) > 10:
            self.state["briefing_history"] = self.state["briefing_history"][-10:]
        self.store.save_briefing(briefing)
        self.save_state()

    def get_latest_briefing(self) -> Optional[Dict[str, Any]]:
        briefing = self.store.get_latest_briefing()
        if briefing:
            self.state["latest_briefing"] = briefing
            return briefing
        return self.state.get("latest_briefing")

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
        self.store.save_feedback(entry)

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

    def remember_preference(self, preference: str) -> Dict[str, Any]:
        """Persist an explicit creator preference and confirm it can be read back."""
        if not isinstance(preference, str) or not preference.strip():
            raise ValueError("Preference must not be empty")

        if not is_meaningful_creator_preference(preference):
            raise ValueError("Preferences must be meaningful creator rules or criteria, not conversational chatter.")

        # Serverless instances can outlive one another. Always merge this write into
        # the latest durable profile instead of an instance's startup snapshot.
        self.reload_state()
        rules = self.state.setdefault("learned_voice_rules", [])
        if preference in rules:
            return {"preference": preference, "created": False}

        node = {
            "node_id": f"mem_{int(time.time()*1000)}",
            "type": "learned_preference",
            "timestamp": time.time(),
            "content": preference,
            "key_takeaways": ["Explicit creator preference", preference]
        }
        rules.append(preference)
        self.state.setdefault("memory_nodes", []).append(node)

        try:
            self.save_state()
            persisted = self.store.get_creator_profile()
            if preference not in persisted.get("learned_voice_rules", []):
                raise RuntimeError("Preference was not confirmed in the persistence store")
        except Exception:
            rules.remove(preference)
            self.state["memory_nodes"].remove(node)
            raise

        try:
            minds_manager.update_learned_preference(preference)
        except Exception:
            pass

        return {"preference": preference, "created": True, "memory_node": node}

    def add_objective(self, title: str, details: str = "") -> Dict[str, Any]:
        """
        Creates and persists a real Creator Objective with lifecycle status 'CREATED'.
        """
        if not isinstance(title, str) or not title.strip():
            raise ValueError("Objective title must not be empty")

        # Merge into the newest durable profile so a warm, stale serverless
        # instance cannot replace objectives written by another instance.
        self.reload_state()
        objectives = self.state.setdefault("creator_objectives", [])
        obj_id = f"obj_{int(time.time() * 1000)}"
        entry = {
            "id": obj_id,
            "title": title,
            "details": details,
            "status": "CREATED",  # CREATED, QUEUED, RUNNING, COMPLETED, FAILED
            "created_at": time.time(),
            "updated_at": time.time(),
            "result": None
        }
        objectives.insert(0, entry)
        self.save_state()
        persisted = self.store.get_creator_profile()
        if not any(
            objective.get("id") == obj_id
            and objective.get("title") == title
            and objective.get("details", "") == details
            for objective in persisted.get("creator_objectives", [])
        ):
            objectives.remove(entry)
            raise RuntimeError("Objective was not confirmed in the persistence store")
        return entry

    def update_objective_status(self, objective_id: str, status: str, result: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Updates objective lifecycle status in persistent creator profile.
        """
        objectives = self.state.setdefault("creator_objectives", [])
        for obj in objectives:
            if obj.get("id") == objective_id:
                obj["status"] = status
                obj["updated_at"] = time.time()
                if result:
                    obj["result"] = result
                self.save_state()
                return obj
        return None

    def get_objectives(self) -> List[Dict[str, Any]]:
        return self.state.get("creator_objectives", [])

    def onboard_creator(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ingest and persist structured onboarding profile context.
        Explicit creator preferences carry higher authority than AI inference.
        """
        if "creator_name" in data and data["creator_name"]:
            self.state["creator_name"] = data["creator_name"]
        if "niche" in data and data["niche"]:
            self.state["niche"] = data["niche"]
        if "audience_description" in data and data["audience_description"]:
            self.state["audience_description"] = data["audience_description"]
        if "brand_voice_attributes" in data and data["brand_voice_attributes"]:
            self.state["brand_voice_attributes"] = data["brand_voice_attributes"]
        if "preferred_tone" in data and data["preferred_tone"]:
            self.state["preferred_tone"] = data["preferred_tone"]
        if "main_goal" in data and data["main_goal"]:
            self.state["main_goal"] = data["main_goal"]
        if "long_term_objective" in data and data["long_term_objective"]:
            self.state["long_term_objective"] = data["long_term_objective"]
        if "content_wanted" in data and data["content_wanted"]:
            self.state["content_wanted"] = data["content_wanted"]
        if "content_not_wanted" in data and data["content_not_wanted"]:
            rejected = self.state.setdefault("rejected_topics", [])
            for item in data["content_not_wanted"]:
                if item not in rejected:
                    rejected.append(item)

        # Record explicit onboarding artifact
        self.ingest_creator_artifact(
            artifact_type="onboarding_profile",
            raw_data={
                "content": f"Creator Profile Onboarded: {self.state.get('creator_name')} ({self.state.get('niche', 'Creator')}). Goal: {self.state.get('main_goal', 'Audience Trust')}.",
                "insights": [
                    f"Niche: {self.state.get('niche', 'Tech')}",
                    f"Tone: {self.state.get('preferred_tone', 'Direct & Practical')}",
                    f"Goal: {self.state.get('main_goal', 'Trust & Growth')}"
                ],
                "source": "EXPLICIT_CREATOR_INPUT"
            }
        )

        self.save_state()
        self._sync_to_minds_sdk()
        return self.state

    def process_rejection_feedback(self, item_id: str, reason_category: str, notes: Optional[str] = None) -> Dict[str, Any]:
        """
        Process explicit creator rejection of a recommendation item.
        Extracts constraint rules and persists them into creator memory.
        """
        reason_rule_map = {
            "Too clickbait": "Avoid clickbait hooks and sensationalist claims.",
            "Wrong tone": "Maintain direct, practical, and non-corporate educational tone.",
            "Too commercial": "Prioritize genuine technical setup value over commercial pitch.",
            "Already covered": "Do not repeat recently covered video script topics.",
            "Not my audience": "Align content strictly with beginner developer and AI builder audience."
        }

        extracted_rule = reason_rule_map.get(reason_category, f"Avoid content matching rejection reason: '{reason_category}'")
        if notes and notes.strip():
            extracted_rule += f" Note: {notes.strip()}"

        # Add to learned rules
        self.add_learned_voice_rule(extracted_rule)

        # Record decision entry in decision_history
        history = self.state.setdefault("decision_history", [])
        date_str = time.strftime("%b %d")
        decision_entry = {
            "id": f"dec_{int(time.time())}",
            "date": date_str,
            "action_type": "REJECTED_PROPOSAL",
            "item_name": item_id.replace("_", " ").title(),
            "decision": f"Rejected recommendation ({reason_category}). {notes or ''}".strip(),
            "constraint_extracted": extracted_rule
        }
        history.insert(0, decision_entry)

        # Record item feedback entry
        entry = self.add_item_feedback(item_id=item_id, feedback_type="not_useful", notes=f"Reason: {reason_category}. {notes or ''}")
        entry["extracted_rule"] = extracted_rule
        entry["decision_entry"] = decision_entry
        self.save_state()
        return entry

    def get_full_state(self) -> Dict[str, Any]:
        return self.state

    def reset_state(self, seed_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if seed_data:
            self.state = seed_data
        else:
            self.state = {
                "creator_name": "Alex Rivera",
                "niche": "Developer Tools & AI Automation",
                "audience_description": "Software engineers and builders entering local AI setup for the first time.",
                "brand_voice_attributes": ["Educational", "Technical yet accessible", "Direct"],
                "preferred_tone": "Conversational, direct and practical",
                "main_goal": "Grow a high-trust technical developer audience",
                "long_term_objective": "Build the premier channel for open-source AI agent workflows",
                "content_wanted": ["Beginner local setup walkthroughs", "Open-source GitHub repos"],
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

