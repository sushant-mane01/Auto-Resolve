"""
Member 1 Self-Test — Validates the core conversation engine end-to-end
using a mock SearchStrategy (no LLM, no network, no FastAPI).

Run:  python tests/test_member1.py
      (from the project root directory)
"""

import asyncio
import sys
import os

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.chat_session import ChatSession
from services.bot_service import BotService
from strategies.search_strategy import SearchStrategy
from typing import Any, Dict, List


# ======================================================================
#  1. Mock Strategy
# ======================================================================

class MockSearchStrategy(SearchStrategy):
    """Always returns a fixed Password Reset resolution."""

    async def search(
        self, query: str, conversation_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        return {
            "issue_category": "Password Reset",
            "resolution": "Go to login page > Forgot Password",
            "confidence": 0.9,
            "source": "MOCK",
        }


# ======================================================================
#  Helpers
# ======================================================================

passed = 0
failed = 0


def assert_true(condition: bool, label: str) -> None:
    global passed, failed
    if condition:
        print(f"  ✅ PASS: {label}")
        passed += 1
    else:
        print(f"  ❌ FAIL: {label}")
        failed += 1


def header(title: str) -> None:
    print(f"\n{'═' * 60}")
    print(f"  {title}")
    print(f"{'═' * 60}")


# ======================================================================
#  2. Test Execution
# ======================================================================

async def run_tests() -> None:
    global passed, failed

    strategy = MockSearchStrategy()
    bot_service = BotService(strategy)
    session = ChatSession("test-session-001")

    # ---- Turn 1: User asks a question --------------------------------
    header('Turn 1 — User: "I can\'t log in"')

    turn1 = await bot_service.handle_message(session, "I can't log in")
    print(f"  Bot reply: {turn1['reply'].splitlines()[0]} ...")

    assert_true("Password Reset" in turn1["reply"], "Reply includes issue category")
    assert_true("Forgot Password" in turn1["reply"], "Reply includes resolution")
    assert_true("Yes / No" in turn1["reply"], "Reply asks for confirmation")
    assert_true(session.awaiting_confirmation is True, "awaiting_confirmation is True")
    assert_true(session.failed_attempts == 0, "failed_attempts is 0")
    assert_true(session.escalated is False, "escalated is False")

    # ---- Turn 2: User says No (first time) ---------------------------
    header('Turn 2 — User: "No"')

    turn2 = await bot_service.handle_message(session, "No")
    print(f"  Bot reply: {turn2['reply'].splitlines()[0]} ...")

    assert_true(session.failed_attempts == 1, "failed_attempts is 1")
    assert_true(session.escalated is False, "escalated is still False")
    assert_true("different approach" in turn2["reply"], "Reply indicates a retry")
    assert_true(
        session.awaiting_confirmation is True,
        "awaiting_confirmation reset to True (retry)",
    )

    # ---- Turn 3: User says No again → escalation ---------------------
    header('Turn 3 — User: "No" (second time → escalation)')

    turn3 = await bot_service.handle_message(session, "No")
    print(f"  Bot reply: {turn3['reply']}")

    assert_true(session.failed_attempts == 2, "failed_attempts is 2")
    assert_true(session.escalated is True, "escalated is TRUE")
    assert_true(turn3["escalated"] is True, "Response object escalated flag is TRUE")
    assert_true("escalating" in turn3["reply"], "Reply mentions escalation")
    assert_true(
        isinstance(turn3.get("conversation_history"), list),
        "Escalation response includes conversation_history",
    )

    # ---- Additional: Test unrecognized input -------------------------
    header("Bonus — Unrecognized confirmation input")

    session2 = ChatSession("test-session-002")
    await bot_service.handle_message(session2, "My email is broken")
    assert_true(
        session2.awaiting_confirmation is True,
        "Session 2 awaiting confirmation",
    )

    t2 = await bot_service.handle_message(session2, "maybe")
    assert_true("Yes or No" in t2["reply"], "Unrecognized input gets a nudge")
    assert_true(
        session2.awaiting_confirmation is True,
        "Still awaiting confirmation after nudge",
    )

    # ---- Additional: Test "yes" confirmation -------------------------
    header('Bonus — User confirms with "Yes"')

    t3 = await bot_service.handle_message(session2, "yes")
    assert_true("Glad that helped" in t3["reply"], "Yes confirmation gets success reply")
    assert_true(
        session2.awaiting_confirmation is False,
        "awaiting_confirmation cleared after Yes",
    )
    assert_true(session2.failed_attempts == 0, "No failures accumulated")

    # ---- Additional: Test to_dict ------------------------------------
    header("Bonus — to_dict() serialization")

    snapshot = session.to_dict()
    assert_true(snapshot["session_id"] == "test-session-001", "to_dict session_id correct")
    assert_true(
        isinstance(snapshot["conversation_history"], list),
        "to_dict has conversation_history list",
    )
    assert_true(snapshot["escalated"] is True, "to_dict reflects escalated state")
    assert_true(
        isinstance(snapshot["conversation_history"][0]["timestamp"], str),
        "Timestamps serialized as ISO strings",
    )

    # ==================================================================
    #  Summary
    # ==================================================================
    header("Test Summary")
    print(f"  Total: {passed + failed}  |  ✅ Passed: {passed}  |  ❌ Failed: {failed}")
    print()

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_tests())
