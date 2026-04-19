"""
ChatSession — Manages all conversation state for a single user session.

Enhanced with: sentiment tracking, urgency detection, feedback collection,
session status, and ticket management for escalated issues.

Rules:
    ❌ No HTML, no LLM calls, no prompt formatting in this file
    ✅ Pure data + state only

Owner: Member 1
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import uuid


class ChatSession:
    """Manages all conversation state for a single user session."""

    def __init__(self, session_id: str) -> None:
        self.session_id: str = session_id
        self.user_email: Optional[str] = None

        # Conversation
        self.conversation_history: List[Dict[str, Any]] = []
        self.failed_attempts: int = 0
        self.awaiting_confirmation: bool = False
        self.escalated: bool = False
        self.last_bot_response: Optional[Dict[str, Any]] = None

        # Enhanced: Sentiment & Urgency
        self.sentiment: str = "neutral"  # positive, neutral, frustrated, angry
        self.urgency: str = "low"  # low, medium, high, critical

        # Enhanced: Feedback per message
        self.feedback: List[Dict[str, Any]] = []

        # Enhanced: Session metadata
        self.created_at: datetime = datetime.now(timezone.utc)
        self.updated_at: datetime = datetime.now(timezone.utc)
        self.status: str = "active"  # active, resolved, escalated
        self.category: Optional[str] = None  # detected issue category

        # Enhanced: Escalation ticket
        self.ticket_id: Optional[str] = None
        self.ticket_status: Optional[str] = None  # open, in_progress, resolved

    # ------------------------------------------------------------------
    #  Mutation helpers
    # ------------------------------------------------------------------

    def add_message(self, role: str, text: str, sentiment: str = None, urgency: str = None) -> int:
        """
        Append a message to the conversation history.
        Returns the index of the new message.
        """
        index = len(self.conversation_history)
        self.conversation_history.append({
            "role": role,
            "text": text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "index": index,
            "sentiment": sentiment,
            "urgency": urgency,
        })
        self.updated_at = datetime.now(timezone.utc)

        # Update session-level sentiment/urgency from latest user message
        if role == "user":
            if sentiment:
                self.sentiment = sentiment
            if urgency:
                self.urgency = urgency

        return index

    def increment_failures(self) -> None:
        self.failed_attempts += 1

    def set_awaiting_confirmation(self, flag: bool) -> None:
        self.awaiting_confirmation = flag

    def set_escalated(self) -> None:
        self.escalated = True
        self.awaiting_confirmation = False
        self.status = "escalated"
        self.ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        self.ticket_status = "open"

    def set_resolved(self) -> None:
        """Mark session as resolved (user confirmed 'Yes')."""
        self.status = "resolved"

    def add_feedback(self, message_index: int, helpful: bool) -> None:
        """Record user feedback for a specific bot message."""
        self.feedback.append({
            "message_index": message_index,
            "helpful": helpful,
            "timestamp": datetime.now(timezone.utc),
        })

    def update_ticket_status(self, new_status: str) -> None:
        """Update the escalation ticket status."""
        if self.ticket_id and new_status in ("open", "in_progress", "resolved"):
            self.ticket_status = new_status
            if new_status == "resolved":
                self.status = "resolved"

    # ------------------------------------------------------------------
    #  Query helpers
    # ------------------------------------------------------------------

    def should_escalate(self) -> bool:
        return self.failed_attempts >= 2

    def get_message_count(self) -> int:
        return len(self.conversation_history)

    def get_user_messages(self) -> List[str]:
        return [m["text"] for m in self.conversation_history if m["role"] == "user"]

    # ------------------------------------------------------------------
    #  Serialization
    # ------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """Returns a clean, JSON-serializable snapshot of the session."""
        return {
            "session_id": self.session_id,
            "conversation_history": [
                {
                    "role": msg["role"],
                    "text": msg["text"],
                    "timestamp": msg["timestamp"],
                    "index": msg.get("index", i),
                    "sentiment": msg.get("sentiment"),
                    "urgency": msg.get("urgency"),
                }
                for i, msg in enumerate(self.conversation_history)
            ],
            "failed_attempts": self.failed_attempts,
            "awaiting_confirmation": self.awaiting_confirmation,
            "escalated": self.escalated,
            "last_bot_response": self.last_bot_response,
            "sentiment": self.sentiment,
            "urgency": self.urgency,
            "feedback": [
                {
                    "message_index": f["message_index"],
                    "helpful": f["helpful"],
                    "timestamp": f["timestamp"].isoformat(),
                }
                for f in self.feedback
            ],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "status": self.status,
            "category": self.category,
            "ticket_id": self.ticket_id,
            "ticket_status": self.ticket_status,
        }

    def to_summary(self) -> Dict[str, Any]:
        """Returns a lightweight summary for session lists."""
        first_user_msg = next(
            (m["text"] for m in self.conversation_history if m["role"] == "user"),
            "No messages yet",
        )
        return {
            "session_id": self.session_id,
            "status": self.status,
            "category": self.category,
            "sentiment": self.sentiment,
            "urgency": self.urgency,
            "message_count": len(self.conversation_history),
            "failed_attempts": self.failed_attempts,
            "first_message": first_user_msg[:100],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "ticket_id": self.ticket_id,
            "ticket_status": self.ticket_status,
        }
