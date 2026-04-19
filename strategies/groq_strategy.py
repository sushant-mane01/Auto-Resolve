"""
GroqStrategy — AI-powered implementation of SearchStrategy.

Uses the Groq API to dynamically analyze the conversation history
and generate contextual, intelligent IT support resolutions.
If the API key is missing or the request fails (e.g., rate limit), it
automatically falls back to the local offline LLMStrategy (Knowledge Base).
"""

import json
import os
import re
from typing import Any, Dict, List, Optional

from groq import AsyncGroq

from strategies.search_strategy import SearchStrategy
from strategies.llm_strategy import LLMStrategy

class GroqStrategy(SearchStrategy):
    """
    Search strategy that calls Groq for intelligent resolutions.
    """

    def __init__(self) -> None:
        self.api_key = os.environ.get("GROQ_API_KEY")
        self.fallback_strategy = LLMStrategy()
        self.client = None
        self.model = "llama-3.3-70b-versatile"

        if self.api_key:
            self.client = AsyncGroq(api_key=self.api_key)

    async def search(
        self,
        query: str,
        conversation_history: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Query Groq for a resolution, with fallback to local KB.
        """
        if not self.client:
            print("[GroqStrategy] No GROQ_API_KEY found, using local knowledge base fallback.")
            fallback_response = await self.fallback_strategy.search(query, conversation_history)
            fallback_response["source"] = "KnowledgeBase (Groq Fallback)"
            return fallback_response

        try:
            # Build conversation context
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are an expert IT Support Chatbot named Auto-Resolve.\n"
                        "Analyze the user's latest query and the conversation history.\n"
                        "Provide a clear, step-by-step resolution. Be friendly and highly technical but accessible.\n"
                        "You MUST respond strictly in valid JSON format. Do not include markdown code blocks or extra text.\n"
                        "Format:\n"
                        "{\n"
                        '  "issue_category": "String (e.g., VPN Connection Issues)",\n'
                        '  "resolution": "String (step-by-step fix)",\n'
                        '  "confidence": 0.95\n'
                        "}\n"
                    )
                }
            ]

            # Add History
            for msg in conversation_history:
                role = "assistant" if msg["role"] == "bot" else "user"
                messages.append({"role": role, "content": msg["text"]})
                
            # Add latest query if it's not already the last one
            if not conversation_history or conversation_history[-1]["text"] != query:
                messages.append({"role": "user", "content": query})

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={"type": "json_object"},
            )
            raw_text = response.choices[0].message.content or "{}"

            # Parse JSON
            data = json.loads(raw_text.strip())

            return {
                "issue_category": data.get("issue_category", "AI IT Support"),
                "resolution": data.get("resolution", "I apologize, but I couldn't formulate a specific fix. Let me fallback or escalate."),
                "confidence": float(data.get("confidence", 0.9)),
                "source": "Groq AI",
            }

        except Exception as e:
            # If rate limited or JSON parsing fails, gracefully fall back
            print(f"[GroqStrategy] API call failed: {e}. Falling back to local KB.")
            try:
                fallback_response = await self.fallback_strategy.search(query, conversation_history)
                fallback_response["source"] = "KnowledgeBase (Groq Fallback)"
                return fallback_response
            except Exception as e2:
                import traceback
                print(f"[GroqStrategy] Fallback also failed: {e2}")
                traceback.print_exc()
                raise

    async def generate_kb_article(self, conversation_history: List[Dict[str, Any]], ticket_id: str, category: str) -> Optional[Dict[str, Any]]:
        if not self.client:
            print("[GroqStrategy] No GROQ_API_KEY found, cannot generate KB article.")
            return None
            
        history_text = "\n".join(
            f"{msg['role'].capitalize()}: {msg['text']}"
            for msg in conversation_history
        )
        
        prompt = f"""
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
"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert IT Support Knowledge Base author.\n"
                            "A ticket has just been resolved by a human administrator. Your task is to analyze the conversation history and generate a structured knowledge base entry to train the AI for future similar issues.\n"
                            "You MUST respond strictly in valid JSON format.\n"
                            "Format:\n"
                            "{\n"
                            f'  "ticket_id": "{ticket_id}",\n'
                            f'  "category": "{category}",\n'
                            '  "operating_system": "all",\n'
                            '  "difficulty_level": "medium",\n'
                            '  "severity": "P2",\n'
                            '  "problem_description": "String summary of what the user experienced",\n'
                            '  "resolution_steps": ["Step 1", "Step 2"],\n'
                            '  "keywords": ["keyword1", "keyword2"],\n'
                            '  "user_utterances": ["phrase 1", "phrase 2"],\n'
                            '  "related_categories": ["software", "network"],\n'
                            '  "escalate_if_failed": false,\n'
                            '  "resolution_time_minutes": 15\n'
                            "}\n"
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
            )
            raw_text = response.choices[0].message.content or "{}"
            return json.loads(raw_text.strip())
        except Exception as e:
            print(f"[GroqStrategy] Failed to generate KB article: {e}")
            return None
