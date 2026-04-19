"""
LLMStrategy — Concrete implementation of SearchStrategy.

Uses an in-memory IT knowledge base with keyword-matching and scoring
to find the best resolution. Works immediately with no API key or
external service required.

The matching algorithm:
    1. Tokenizes the user query into lowercase words
    2. Scores each KB entry by how many keyword hits it gets
    3. Adds bonus weight for exact phrase matches
    4. Returns the best match (or a fallback "unknown issue" response)

For retry attempts (when conversation_history shows a prior failed answer),
the algorithm skips the previously suggested category and picks the
next best match — giving the user a genuinely different answer.

Owner: Member 2
"""

import re
from typing import Any, Dict, List, Optional

from strategies.search_strategy import SearchStrategy
from models.database import SessionLocal, DBKnowledgeEntry


class LLMStrategy(SearchStrategy):
    """
    Knowledge-base-powered search strategy with intelligent matching.
    """

    def _get_kb(self):
        db = SessionLocal()
        try:
            entries = db.query(DBKnowledgeEntry).all()
            return [
                {
                    "category": e.category,
                    "keywords": e.get_json_field("keywords") + e.get_json_field("user_utterances"),
                    "resolution": "\n".join(e.get_json_field("resolution_steps")),
                    "follow_up": f"Could not fully resolve. Escalate to '{e.category}' support. (Ref: {e.ticket_id})",
                }
                for e in entries
            ]
        finally:
            db.close()

    def __init__(self) -> None:
        pass

    async def search(
        self,
        query: str,
        conversation_history: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Search the knowledge base for the best matching resolution.

        Args:
            query: The user's message (or concatenated messages on retry).
            conversation_history: Full conversation for context.

        Returns:
            Structured resolution dict.
        """
        # Determine which categories have already been tried (for retries)
        tried_categories = self._get_tried_categories(conversation_history)

        # Score every KB entry against the query
        scored_entries = self._score_entries(query)

        # Pick the best match that hasn't been tried yet
        best_match = self._pick_best(scored_entries, tried_categories)

        if best_match is None:
            return self._fallback_response()

        entry, score = best_match

        # Decide whether to use the primary resolution or follow-up
        resolution_steps = entry.get("resolution_steps", [])
        if isinstance(resolution_steps, list) and len(resolution_steps) > 0:
            resolution_text = "\n".join([f"{i+1}. {step}" for i, step in enumerate(resolution_steps)])
        else:
            resolution_text = str(resolution_steps) if resolution_steps else "Please reach out to support, resolution not documented."

        # Calculate confidence based on score (normalize to 0.0–1.0)
        confidence = min(score / 10.0, 1.0)

        return {
            "issue_category": entry["category"],
            "resolution": resolution_text,
            "confidence": round(confidence, 2),
            "source": "KnowledgeBase",
        }

    # ------------------------------------------------------------------
    #  Scoring engine
    # ------------------------------------------------------------------

    def _score_entries(self, query: str) -> List[tuple]:
        """
        Score each KB entry against the query.

        Returns:
            List of (entry, score) tuples, sorted highest score first.
        """
        query_lower = query.lower()
        query_tokens = set(re.findall(r"\w+", query_lower))

        scored: List[tuple] = []
        kb_entries = self._get_kb()

        for entry in kb_entries:
            score = 0.0

            for keyword in entry["keywords"]:
                kw_lower = keyword.lower()

                # Exact phrase match in query — strong signal
                if kw_lower in query_lower:
                    # Multi-word keywords get higher weight
                    word_count = len(kw_lower.split())
                    score += 3.0 * word_count

                # Individual token overlap
                kw_tokens = set(re.findall(r"\w+", kw_lower))
                overlap = query_tokens & kw_tokens
                score += len(overlap) * 1.0

            if score > 0:
                scored.append((entry, score))

        # Sort by score descending
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored

    def _pick_best(
        self,
        scored_entries: List[tuple],
        tried_categories: set,
    ) -> Optional[tuple]:
        """
        Pick the highest-scoring entry, preferring untried categories.
        If all top matches have been tried, return the best tried match
        (which will use its follow_up text instead).
        """
        best_untried = None
        best_tried = None

        for entry, score in scored_entries:
            if entry["category"] not in tried_categories:
                if best_untried is None:
                    best_untried = (entry, score)
            else:
                if best_tried is None:
                    best_tried = (entry, score)

        # Prefer untried; fall back to tried (with follow_up)
        return best_untried or best_tried

    # ------------------------------------------------------------------
    #  Context helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _get_tried_categories(
        conversation_history: List[Dict[str, Any]],
    ) -> set:
        """
        Extract issue categories that the bot has already suggested
        by parsing previous bot messages.
        """
        tried = set()
        for msg in conversation_history:
            if msg.get("role") == "bot":
                text = msg.get("text", "")
                # Look for "Issue Category: <name>" in bot messages
                match = re.search(r"Issue Category:\s*(.+?)(?:\n|$)", text)
                if match:
                    tried.add(match.group(1).strip())
        return tried

    # ------------------------------------------------------------------
    #  Fallback
    # ------------------------------------------------------------------

    @staticmethod
    def _fallback_response() -> Dict[str, Any]:
        """
        Return a generic response when no KB entry matches.
        """
        return {
            "issue_category": "General IT Support",
            "resolution": (
                "I wasn't able to find a specific solution for your issue. "
                "Here are some general troubleshooting steps:\n"
                "1. Restart your computer.\n"
                "2. Check your internet connection.\n"
                "3. Make sure all software is up to date.\n"
                "4. Clear your browser cache and cookies.\n"
                "5. If the issue persists, please provide more details "
                "about the error or problem you're experiencing."
            ),
            "confidence": 0.3,
            "source": "KnowledgeBase-Fallback",
        }
