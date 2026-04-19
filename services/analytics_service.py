"""
AnalyticsService — Computes dashboard statistics from session data.
"""

from typing import Any, Dict, List
from collections import Counter
from datetime import datetime, timezone, timedelta

from models.chat_session import ChatSession


class AnalyticsService:
    """Compute analytics from the in-memory session store."""

    @staticmethod
    def compute_stats(sessions: Dict[str, ChatSession]) -> Dict[str, Any]:
        """
        Compute all dashboard metrics.

        Args:
            sessions: The session store dict (session_id → ChatSession).

        Returns:
            Full analytics payload.
        """
        all_sessions = list(sessions.values())
        total = len(all_sessions)

        if total == 0:
            return AnalyticsService._empty_stats()

        active = sum(1 for s in all_sessions if s.status == "active")
        resolved = sum(1 for s in all_sessions if s.status == "resolved")
        escalated = sum(1 for s in all_sessions if s.status == "escalated")

        # Category breakdown
        categories = Counter(
            s.category for s in all_sessions if s.category
        )

        # Sentiment breakdown
        sentiments = Counter(s.sentiment for s in all_sessions)

        # Urgency breakdown
        urgencies = Counter(s.urgency for s in all_sessions)

        # Average confidence
        confidences = [
            s.last_bot_response["confidence"]
            for s in all_sessions
            if s.last_bot_response and "confidence" in s.last_bot_response
        ]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        # Resolution rate
        resolution_rate = (resolved / total * 100) if total > 0 else 0

        # Feedback stats
        total_feedback = sum(len(s.feedback) for s in all_sessions)
        helpful_count = sum(
            1 for s in all_sessions for f in s.feedback if f["helpful"]
        )
        unhelpful_count = total_feedback - helpful_count

        # Total messages
        total_messages = sum(len(s.conversation_history) for s in all_sessions)

        # Queries over time (last 24 hours, grouped by hour)
        now = datetime.now(timezone.utc)
        queries_by_hour = {}
        for s in all_sessions:
            for msg in s.conversation_history:
                if msg["role"] == "user":
                    ts = msg["timestamp"]
                    if isinstance(ts, str):
                        ts = datetime.fromisoformat(ts)
                    if now - ts < timedelta(hours=24):
                        hour_key = ts.strftime("%H:00")
                        queries_by_hour[hour_key] = queries_by_hour.get(hour_key, 0) + 1

        # Sort hours
        sorted_hours = sorted(queries_by_hour.items())

        # Escalated tickets summary
        tickets = [
            {
                "ticket_id": s.ticket_id,
                "session_id": s.session_id,
                "category": s.category,
                "urgency": s.urgency,
                "sentiment": s.sentiment,
                "ticket_status": s.ticket_status,
                "first_message": next(
                    (m["text"] for m in s.conversation_history if m["role"] == "user"),
                    "N/A",
                )[:100],
                "message_count": len(s.conversation_history),
                "failed_attempts": s.failed_attempts,
                "created_at": s.created_at.isoformat(),
            }
            for s in all_sessions
            if s.escalated and s.ticket_id
        ]

        return {
            "total_sessions": total,
            "active_sessions": active,
            "resolved_sessions": resolved,
            "escalated_sessions": escalated,
            "resolution_rate": round(resolution_rate, 1),
            "avg_confidence": round(avg_confidence, 2),
            "total_messages": total_messages,
            "category_breakdown": dict(categories),
            "sentiment_breakdown": dict(sentiments),
            "urgency_breakdown": dict(urgencies),
            "queries_by_hour": sorted_hours,
            "feedback": {
                "total": total_feedback,
                "helpful": helpful_count,
                "unhelpful": unhelpful_count,
            },
            "tickets": tickets,
        }

    @staticmethod
    def _empty_stats() -> Dict[str, Any]:
        return {
            "total_sessions": 0,
            "active_sessions": 0,
            "resolved_sessions": 0,
            "escalated_sessions": 0,
            "resolution_rate": 0,
            "avg_confidence": 0,
            "total_messages": 0,
            "category_breakdown": {},
            "sentiment_breakdown": {},
            "urgency_breakdown": {},
            "queries_by_hour": [],
            "feedback": {"total": 0, "helpful": 0, "unhelpful": 0},
            "tickets": [],
        }
