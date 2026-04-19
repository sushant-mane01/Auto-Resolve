"""
BotService — The core flow controller for the IT Support Chatbot.

Enhanced with: sentiment detection, urgency classification, and
feedback-aware conversation handling.

Rules:
    ❌ No prompt formatting (Member 2's job)
    ❌ No direct LLM / API calls (delegate to strategy)
    ❌ No DOM / route manipulation (Member 3's job)
    ✅ All flow logic lives here

Owner: Member 1
"""

import re
from typing import Any, Dict

from models.chat_session import ChatSession
from strategies.search_strategy import SearchStrategy


# Sentiment keywords for local detection (used as fallback)
FRUSTRATED_WORDS = {
    "frustrated", "annoying", "annoyed", "angry", "hate", "terrible",
    "worst", "useless", "stupid", "broken", "ridiculous", "unacceptable",
    "furious", "pathetic", "garbage", "trash", "awful", "horrible",
}
URGENT_WORDS = {
    "urgent", "asap", "emergency", "critical", "immediately", "now",
    "deadline", "important", "blocking", "blocker", "production down",
    "can't work", "cannot work", "stuck",
}
POSITIVE_WORDS = {
    "thanks", "thank you", "great", "awesome", "perfect", "excellent",
    "wonderful", "amazing", "love", "appreciate", "helpful", "good",
}


class BotService:
    """Core flow controller — confirm / retry / escalate + sentiment."""

    def __init__(self, strategy: SearchStrategy) -> None:
        self.strategy = strategy
        # SSE notification callback (set by app.py for real-time alerts)
        self.on_escalation = None

    # ------------------------------------------------------------------
    #  Sentiment & Urgency Detection
    # ------------------------------------------------------------------

    @staticmethod
    def detect_sentiment(text: str) -> str:
        """Detect user sentiment from message text."""
        lower = text.lower()
        words = set(re.findall(r"\w+", lower))

        frustrated_count = len(words & FRUSTRATED_WORDS)
        positive_count = len(words & POSITIVE_WORDS)

        # Check for caps lock shouting
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        has_multiple_exclamations = text.count("!") >= 2

        if frustrated_count >= 2 or (frustrated_count >= 1 and has_multiple_exclamations):
            return "angry"
        elif frustrated_count >= 1 or (caps_ratio > 0.5 and len(text) > 5):
            return "frustrated"
        elif positive_count >= 1:
            return "positive"
        return "neutral"

    @staticmethod
    def detect_urgency(text: str) -> str:
        """Detect urgency level from message text."""
        lower = text.lower()
        words = set(re.findall(r"\w+", lower))
        urgent_count = len(words & URGENT_WORDS)

        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        has_multiple_exclamations = text.count("!") >= 3

        if urgent_count >= 2 or (urgent_count >= 1 and has_multiple_exclamations):
            return "critical"
        elif urgent_count >= 1 or "please help" in lower:
            return "high"
        elif caps_ratio > 0.5 and len(text) > 10:
            return "medium"
        return "low"

    # ------------------------------------------------------------------
    #  Public entry point
    # ------------------------------------------------------------------

    async def handle_message(
        self, session: ChatSession, user_text: str
    ) -> Dict[str, Any]:
        """Process an incoming user message within the given session."""

        # Detect sentiment & urgency
        sentiment = self.detect_sentiment(user_text)
        urgency = self.detect_urgency(user_text)

        # Record the user's message with sentiment data
        msg_index = session.add_message("user", user_text, sentiment=sentiment, urgency=urgency)

        # Branch: confirmation flow vs. new-query flow
        if session.awaiting_confirmation:
            return await self.handle_confirmation(session, user_text)

        # New query — delegate to the strategy
        result = await self.strategy.search(
            user_text, session.conversation_history
        )

        # Store the structured result
        session.last_bot_response = result
        session.category = result.get("issue_category")

        # Build reply
        reply = self._format_resolution(result, sentiment)
        bot_index = session.add_message("bot", reply)
        session.set_awaiting_confirmation(True)

        return {
            "reply": reply,
            "escalated": session.escalated,
            "failed_attempts": session.failed_attempts,
            "session_id": session.session_id,
            "sentiment": sentiment,
            "urgency": urgency,
            "category": session.category,
            "awaiting_confirmation": True,
            "message_index": bot_index,
        }

    # ------------------------------------------------------------------
    #  Confirmation handler
    # ------------------------------------------------------------------

    async def handle_confirmation(
        self, session: ChatSession, user_text: str
    ) -> Dict[str, Any]:
        normalized = user_text.strip().lower()

        # ------- YES -------
        if normalized == "yes" or normalized.startswith("y"):
            session.set_awaiting_confirmation(False)
            session.set_resolved()
            reply = (
                "Great! Glad that helped. "
                "Let me know if anything else comes up."
            )
            bot_index = session.add_message("bot", reply)
            return {
                "reply": reply,
                "escalated": session.escalated,
                "failed_attempts": session.failed_attempts,
                "session_id": session.session_id,
                "sentiment": session.sentiment,
                "urgency": session.urgency,
                "category": session.category,
                "awaiting_confirmation": False,
                "message_index": bot_index,
            }

        # ------- NO --------
        if normalized == "no" or normalized.startswith("n"):
            session.increment_failures()
            session.set_awaiting_confirmation(False)

            if session.should_escalate():
                return self.escalate(session)

            # Preserve the original category from the first query
            original_category = session.category

            retry_preamble = "Let me try a different approach..."
            # Filter out confirmation words (yes/no) from user messages
            user_messages = " ".join(
                m for m in session.get_user_messages() 
                if m.strip().lower() not in ("no", "yes", "n", "y")
            )

            result = await self.strategy.search(
                user_messages, session.conversation_history
            )
            session.last_bot_response = result
            # Keep original category instead of overwriting with AI's re-categorization
            session.category = original_category or result.get("issue_category")

            resolution = self._format_resolution(result, session.sentiment)
            reply = f"{retry_preamble}\n\n{resolution}"
            bot_index = session.add_message("bot", reply)
            session.set_awaiting_confirmation(True)

            return {
                "reply": reply,
                "escalated": session.escalated,
                "failed_attempts": session.failed_attempts,
                "session_id": session.session_id,
                "sentiment": session.sentiment,
                "urgency": session.urgency,
                "category": session.category,
                "awaiting_confirmation": True,
                "message_index": bot_index,
            }

        # ------- UNRECOGNIZED -------
        nudge = "Please reply with Yes or No — did that resolve your issue?"
        bot_index = session.add_message("bot", nudge)
        return {
            "reply": nudge,
            "escalated": session.escalated,
            "failed_attempts": session.failed_attempts,
            "session_id": session.session_id,
            "sentiment": session.sentiment,
            "urgency": session.urgency,
            "category": session.category,
            "awaiting_confirmation": True,
            "message_index": bot_index,
        }

    # ------------------------------------------------------------------
    #  Escalation
    # ------------------------------------------------------------------

    def escalate(self, session: ChatSession) -> Dict[str, Any]:
        session.set_escalated()

        reply = (
            "I'm escalating this to a human IT agent. "
            "A ticket has been created with your conversation history."
        )
        bot_index = session.add_message("bot", reply)

        result = {
            "reply": reply,
            "escalated": True,
            "failed_attempts": session.failed_attempts,
            "session_id": session.session_id,
            "sentiment": session.sentiment,
            "urgency": session.urgency,
            "category": session.category,
            "awaiting_confirmation": False,
            "message_index": bot_index,
            "ticket_id": session.ticket_id,
            "conversation_history": session.conversation_history,
        }

        # Fire SSE notification if callback is set
        if self.on_escalation:
            self.on_escalation(session)

        return result

    # ------------------------------------------------------------------
    #  Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _format_resolution(result: Dict[str, Any], sentiment: str = "neutral") -> str:
        confidence_pct = f"{result['confidence'] * 100:.0f}%"

        # Empathetic preamble for frustrated/angry users
        preamble = ""
        if sentiment in ("frustrated", "angry"):
            preamble = (
                "I understand this is frustrating, and I'm sorry for the inconvenience. "
                "Let me help you resolve this.\n\n"
            )

        return (
            f"{preamble}"
            f"Issue Category: {result['issue_category']}\n"
            f"Suggested Resolution: {result['resolution']}\n"
            f"Confidence: {confidence_pct}\n\n"
            f"Did that resolve your issue? (Yes / No)"
        )
