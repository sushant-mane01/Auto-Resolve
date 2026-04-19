"""
GeminiStrategy — AI-powered implementation of SearchStrategy.

Uses the Google Gemini API to dynamically analyze the conversation history
and generate contextual, intelligent IT support resolutions.
If the API key is missing or the request fails (e.g., rate limit), it
automatically falls back to the local offline LLMStrategy (Knowledge Base).

Owner: Member 2
"""

import json
import os
import re
from typing import Any, Dict, List, Optional

import google.generativeai as genai

from strategies.search_strategy import SearchStrategy
from strategies.llm_strategy import LLMStrategy


class GeminiStrategy(SearchStrategy):
    """
    Search strategy that calls Google Gemini for intelligent resolutions.
    """

    def __init__(self) -> None:
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.fallback_strategy = LLMStrategy()
        self.model = None

        if self.api_key:
            genai.configure(api_key=self.api_key)
            # Use flash for fast chatbot responses
            self.model = genai.GenerativeModel("gemini-pro")

    async def search(
        self,
        query: str,
        conversation_history: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Query Gemini for a resolution, with fallback to local KB.
        """
        # If no API key was provided in the environment, use the local fallback
        if not self.model:
            print("[GeminiStrategy] No GEMINI_API_KEY found, using local knowledge base fallback.")
            return await self.fallback_strategy.search(query, conversation_history)

        try:
            # Build conversation context
            history_text = "\n".join(
                f"{msg['role'].capitalize()}: {msg['text']}"
                for msg in conversation_history
            )

            prompt = f"""
You are an expert IT Support Chatbot named Auto-Resolve.
Analyze the user's latest query and the conversation history.
Provide a clear, step-by-step resolution. Be friendly and highly technical but accessible.

Conversation History:
{history_text}

Latest Query: {query}

Instructions:
1. Identify the high-level issue category.
2. Provide a step-by-step resolution. If this is a retry attempt (user previously said No), provide a DIFFERENT approach than the one already suggested in the history.
3. Express your confidence in this resolution as a float between 0.0 and 1.0.

You MUST respond strictly in valid JSON format. Do not include markdown code blocks or extra text.
Format:
{{
  "issue_category": "String (e.g., VPN Connection Issues)",
  "resolution": "String (step-by-step fix)",
  "confidence": 0.95
}}
"""

            # Call the Gemini API. We use generate_content_async for non-blocking IO.
            response = await self.model.generate_content_async(prompt)
            raw_text = response.text.strip()

            # Clean up markdown formatting if Gemini generated it
            raw_text = re.sub(r"^```json", "", raw_text)
            raw_text = re.sub(r"^```", "", raw_text)
            raw_text = re.sub(r"```$", "", raw_text)

            # Parse JSON
            data = json.loads(raw_text.strip())

            return {
                "issue_category": data.get("issue_category", "AI IT Support"),
                "resolution": data.get("resolution", "I apologize, but I couldn't formulate a specific fix. Let me fallback or escalate."),
                "confidence": float(data.get("confidence", 0.9)),
                "source": "Google Gemini",
            }

        except Exception as e:
            # If rate limited (HTTP 429) or JSON parsing fails, gracefully fall back
            print(f"[GeminiStrategy] API call failed: {e}. Falling back to local KB.")
            try:
                fallback_response = await self.fallback_strategy.search(query, conversation_history)
                fallback_response["source"] = "KnowledgeBase (Gemini Fallback)"
                return fallback_response
            except Exception as e2:
                import traceback
                print(f"[GeminiStrategy] Fallback also failed: {e2}")
                traceback.print_exc()
                raise

    async def generate_kb_article(self, conversation_history: List[Dict[str, Any]], ticket_id: str, category: str) -> Optional[Dict[str, Any]]:
        if not self.model:
            print("[GeminiStrategy] No GEMINI_API_KEY found, cannot generate KB article.")
            return None
            
        history_text = "\n".join(
            f"{msg['role'].capitalize()}: {msg['text']}"
            for msg in conversation_history
        )
        
        prompt = f"""
You are an expert IT Support Knowledge Base author.
A ticket has just been resolved by a human administrator. Your task is to analyze the conversation history and generate a structured knowledge base entry to train the AI for future similar issues.

Ticket Category: {category}
Conversation History:
{history_text}

Instructions:
Extract the core problem and the final resolution steps provided by the administrator or the AI.
Formulate a generalized problem description.
Create an array of step-by-step instructions for the resolution.
Identify keywords and common user utterances (how a user might ask this question).
Determine the operating system (windows, macOS, linux, or all).
Determine the difficulty (low, medium, high) and severity (P1, P2, P3).

You MUST respond strictly in valid JSON format.
Format:
{{
  "ticket_id": "{ticket_id}",
  "category": "{category}",
  "operating_system": "all",
  "difficulty_level": "medium",
  "severity": "P2",
  "problem_description": "String summary of what the user experienced",
  "resolution_steps": ["Step 1", "Step 2"],
  "keywords": ["keyword1", "keyword2"],
  "user_utterances": ["phrase 1", "phrase 2"],
  "related_categories": ["software", "network"],
  "escalate_if_failed": false,
  "resolution_time_minutes": 15
}}
"""
        try:
            response = await self.model.generate_content_async(prompt)
            raw_text = response.text.strip()
            raw_text = re.sub(r"^```json", "", raw_text)
            raw_text = re.sub(r"^```", "", raw_text)
            raw_text = re.sub(r"```$", "", raw_text)
            return json.loads(raw_text.strip())
        except Exception as e:
            print(f"[GeminiStrategy] Failed to generate KB article: {e}")
            return None
