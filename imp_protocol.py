import time
import uuid
import datetime
from typing import Dict, List, Any, Optional, Callable, Awaitable
from dataclasses import dataclass, field, asdict

@dataclass
class IMPMessage:
    protocol_version: str = "1.0"
    message_id: str = field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:8]}")
    timestamp: str = field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    sender_mind: str = "GreenroomCore" # GreenroomCore, ScoutMind, CommunityMind, BusinessMind, User
    target_mind: str = "GreenroomCore"
    action_type: str = "FLAG_TREND" # FLAG_TREND, QUERY_MEMORY, DELEGATE_DRAFT, UPDATE_STATE, PITCH_PROPOSAL, AUDIENCE_INSIGHT, USER_FEEDBACK
    confidence_score: float = 1.00
    payload: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class IMPEventBus:
    def __init__(self):
        self.message_history: List[IMPMessage] = []
        self._listeners: List[Callable[[IMPMessage], Awaitable[None]]] = []

    def subscribe(self, callback: Callable[[IMPMessage], Awaitable[None]]):
        self._listeners.append(callback)

    def unsubscribe(self, callback: Callable[[IMPMessage], Awaitable[None]]):
        if callback in self._listeners:
            self._listeners.remove(callback)

    async def publish(self, message: IMPMessage) -> IMPMessage:
        self.message_history.append(message)
        # Retain last 200 messages
        if len(self.message_history) > 200:
            self.message_history = self.message_history[-200:]

        for listener in self._listeners:
            try:
                await listener(message)
            except Exception as e:
                print(f"[IMPEventBus] Error notifying listener: {e}")
        return message

    def create_and_publish_sync(
        self,
        sender_mind: str,
        target_mind: str,
        action_type: str,
        confidence_score: float,
        payload: Dict[str, Any]
    ) -> IMPMessage:
        msg = IMPMessage(
            sender_mind=sender_mind,
            target_mind=target_mind,
            action_type=action_type,
            confidence_score=confidence_score,
            payload=payload
        )
        self.message_history.append(msg)
        return msg

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [m.to_dict() for m in self.message_history[-limit:]]

    def clear(self):
        self.message_history.clear()

# Global IMP Bus instance
imp_bus = IMPEventBus()
