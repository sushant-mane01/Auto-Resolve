"""
Member 2 Self-Test — Validates the LLMStrategy (knowledge base search)
and its integration with BotService end-to-end.

Run:  python3 tests/test_member2.py
      (from the project root directory)
"""

import asyncio
import sys
import os

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.chat_session import ChatSession
from services.bot_service import BotService
from strategies.llm_strategy import LLMStrategy


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
#  Tests
# ======================================================================

async def run_tests() -> None:
    global passed, failed

    strategy = LLMStrategy()
    bot_service = BotService(strategy)

    # ---- Test 1: Password-related query ------------------------------
    header("Test 1 — Password query matches Password Reset")

    session1 = ChatSession("test-kb-001")
    result1 = await bot_service.handle_message(session1, "I forgot my password and can't log in")
    print(f"  Reply preview: {result1['reply'].splitlines()[0]}")

    assert_true("Password Reset" in result1["reply"], "Matched 'Password Reset' category")
    assert_true("Forgot Password" in result1["reply"], "Resolution mentions 'Forgot Password'")
    assert_true("Yes / No" in result1["reply"], "Asks for confirmation")

    # ---- Test 2: Email-related query ---------------------------------
    header("Test 2 — Email query matches Email Not Working")

    session2 = ChatSession("test-kb-002")
    result2 = await bot_service.handle_message(session2, "My email isn't working in Outlook")
    print(f"  Reply preview: {result2['reply'].splitlines()[0]}")

    assert_true("Email" in result2["reply"], "Matched an email-related category")
    assert_true("Yes / No" in result2["reply"], "Asks for confirmation")

    # ---- Test 3: WiFi query ------------------------------------------
    header("Test 3 — WiFi query matches WiFi / Network Issues")

    session3 = ChatSession("test-kb-003")
    result3 = await bot_service.handle_message(session3, "I can't connect to the WiFi")
    print(f"  Reply preview: {result3['reply'].splitlines()[0]}")

    assert_true("WiFi" in result3["reply"] or "Network" in result3["reply"],
                "Matched WiFi/Network category")

    # ---- Test 4: Printer query ---------------------------------------
    header("Test 4 — Printer query matches Printer Issues")

    session4 = ChatSession("test-kb-004")
    result4 = await bot_service.handle_message(session4, "The printer says offline and I can't print")
    print(f"  Reply preview: {result4['reply'].splitlines()[0]}")

    assert_true("Printer" in result4["reply"], "Matched Printer category")

    # ---- Test 5: VPN query -------------------------------------------
    header("Test 5 — VPN query matches VPN Connection Issues")

    session5 = ChatSession("test-kb-005")
    result5 = await bot_service.handle_message(session5, "VPN keeps disconnecting when I work from home")
    print(f"  Reply preview: {result5['reply'].splitlines()[0]}")

    assert_true("VPN" in result5["reply"], "Matched VPN category")

    # ---- Test 6: Slow computer query ---------------------------------
    header("Test 6 — Performance query matches Slow Computer")

    session6 = ChatSession("test-kb-006")
    result6 = await bot_service.handle_message(session6, "My computer is very slow and laggy")
    print(f"  Reply preview: {result6['reply'].splitlines()[0]}")

    assert_true("Slow" in result6["reply"] or "Performance" in result6["reply"],
                "Matched performance category")

    # ---- Test 7: Unknown query → fallback ----------------------------
    header("Test 7 — Unknown query gets fallback response")

    session7 = ChatSession("test-kb-007")
    result7 = await bot_service.handle_message(session7, "How do I book a conference room for Tuesday?")
    print(f"  Reply preview: {result7['reply'].splitlines()[0]}")

    assert_true("General IT Support" in result7["reply"], "Falls back to General IT Support")
    assert_true("Yes / No" in result7["reply"], "Still asks for confirmation")

    # ---- Test 8: Full conversation with retry (different answer) -----
    header("Test 8 — Retry gives a different approach")

    session8 = ChatSession("test-kb-008")

    # First attempt
    r1 = await bot_service.handle_message(session8, "I can't log in to my account")
    first_category = "Password Reset"  # Expected match
    print(f"  First reply category: {first_category}")
    assert_true(first_category in r1["reply"], "First attempt matches Password Reset")

    # User says No → retry
    r2 = await bot_service.handle_message(session8, "No")
    print(f"  Retry reply preview: {r2['reply'].splitlines()[0]}")
    assert_true("different approach" in r2["reply"], "Retry preamble present")
    assert_true(session8.failed_attempts == 1, "failed_attempts is 1 after first No")

    # ---- Test 9: Confidence score is reasonable ----------------------
    header("Test 9 — Confidence scores are in valid range")

    strategy_direct = LLMStrategy()
    result_direct = await strategy_direct.search("forgot password", [])
    print(f"  Confidence: {result_direct['confidence']}")

    assert_true(0.0 <= result_direct["confidence"] <= 1.0, "Confidence is between 0.0 and 1.0")
    assert_true(result_direct["confidence"] >= 0.5, "Strong match has confidence >= 0.5")
    assert_true(result_direct["source"] == "KnowledgeBase", "Source is 'KnowledgeBase'")

    # ---- Test 10: End-to-end escalation with real strategy -----------
    header("Test 10 — Full conversation → escalation with real KB")

    session10 = ChatSession("test-kb-010")

    await bot_service.handle_message(session10, "I can't access my email")
    assert_true(session10.awaiting_confirmation, "Awaiting confirmation after first query")

    await bot_service.handle_message(session10, "no")
    assert_true(session10.failed_attempts == 1, "failed_attempts = 1")

    r_final = await bot_service.handle_message(session10, "no")
    assert_true(session10.escalated, "Session is escalated after 2 failures")
    assert_true(r_final["escalated"] is True, "Response escalated flag is True")
    assert_true("escalating" in r_final["reply"], "Escalation message present")

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
