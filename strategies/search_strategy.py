"""
SearchStrategy — Abstract base class / interface stub.

Member 2 will create concrete subclasses (e.g. LLMStrategy) that
implement the search() method.  BotService depends on this contract
so it can delegate all "intelligence" work without knowing the
implementation details.

Owner: Member 2 (stub provided by Member 1)
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class SearchStrategy(ABC):
    """
    Abstract base class for search/resolution strategies.

    Member 2 must subclass this and implement search().

    Expected return shape from search():
        {
            "issue_category": str,    # e.g. "Password Reset"
            "resolution": str,        # e.g. "Go to Settings > Reset Password"
            "confidence": float,      # 0.0 - 1.0
            "source": str             # e.g. "GPT-4", "KnowledgeBase"
        }
    """

    @abstractmethod
    async def search(
        self,
        query: str,
        conversation_history: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Search for a resolution to the user's query.

        Args:
            query: The user's latest message text.
            conversation_history: Full conversation history for context.

        Returns:
            A structured resolution dict with keys:
                issue_category, resolution, confidence, source.

        Raises:
            NotImplementedError: If the subclass hasn't implemented this.
        """
        raise NotImplementedError("search() must be implemented by a subclass")
