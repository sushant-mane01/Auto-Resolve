# Project Auto-Resolve — Core Conversation Engine (Member 1)

> AI-powered IT Support Chatbot — Brain + State Layer (Python / FastAPI)

---

## 📦 What Member 1 Owns

| File | Purpose |
|------|---------|
| `models/chat_session.py` | Conversation state: history, flags, counters |
| `services/bot_service.py` | Flow controller: confirm → retry → escalate |
| `controller/agent_controller.py` | Stateful singleton: session store + orchestration |

### Stubs provided for other members

| File | Owner | Purpose |
|------|-------|---------|
| `strategies/search_strategy.py` | Member 2 | Abstract base class for LLM / KB search |
| `routes/chat_routes.py` | Member 3 | FastAPI router stub |
| `app.py` | Member 3 | FastAPI app entry point stub |

---

## 🚀 Quick Start

```bash
pip install -r requirements.txt
python tests/test_member1.py     # Run self-tests (no server needed)
```

To start the FastAPI server (once Member 3 completes the routes):

```bash
uvicorn app:app --host 0.0.0.0 --port 3000 --reload
# or
python app.py
```

---

## 🧠 Session State Shape

Every `ChatSession` instance holds the following state:

```python
{
    "session_id": "string",                     # Unique session identifier
    "conversation_history": [                   # Ordered message log
        {
            "role": "user" | "bot",
            "text": "string",
            "timestamp": "2026-04-17T10:00:00+00:00"   # ISO 8601
        }
    ],
    "failed_attempts": 0,                       # Counter: user said "No"
    "awaiting_confirmation": False,             # Bot waiting for Yes/No?
    "escalated": False,                         # Handed off to human?
    "last_bot_response": {                      # Last structured strategy result
        "issue_category": "string",
        "resolution": "string",
        "confidence": 0.9,
        "source": "string"
    } | None
}
```

---

## 🔌 How Member 2 Plugs In (SearchStrategy)

Member 2 must create a subclass of `SearchStrategy` that implements the `search()` method:

```python
# strategies/llm_strategy.py
from strategies.search_strategy import SearchStrategy
from typing import Any, Dict, List


class LLMStrategy(SearchStrategy):
    async def search(
        self, query: str, conversation_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        # Call your LLM / knowledge base here
        return {
            "issue_category": "Password Reset",
            "resolution": "Go to Settings > Reset Password",
            "confidence": 0.85,
            "source": "GPT-4",
        }
```

Then inject it into the AgentController singleton:

```python
from controller import agent_controller
from strategies.llm_strategy import LLMStrategy

agent_controller.set_strategy(LLMStrategy())
```

Or create a fresh instance:

```python
from controller.agent_controller import AgentController
from strategies.llm_strategy import LLMStrategy

controller = AgentController(strategy=LLMStrategy())
```

---

## 🔌 How Member 3 Plugs In (Routes + UI)

Member 3 imports the AgentController singleton and calls its methods:

```python
# routes/chat_routes.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from controller import agent_controller

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str


@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    result = await agent_controller.chat(request.session_id, request.message)
    return result


@router.get("/sessions")
async def get_sessions():
    return agent_controller.get_all_sessions()


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    session = agent_controller.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict()
```

---

## 📋 Handoff Contracts

### `agent_controller.chat(session_id, user_text)` → Response

```python
{
    "reply": "string",                    # Bot's text reply
    "escalated": False,                   # True if escalated to human
    "failed_attempts": 0,                 # Current failure count
    "session_id": "string",              # Session identifier
    "conversation_history": [...]         # Only present on escalation
}
```

### `agent_controller.get_session(session_id)` → `ChatSession | None`

Returns the raw `ChatSession` instance, or `None` if not found.

### `agent_controller.get_all_sessions()` → `list[dict]`

Returns a list of `session.to_dict()` snapshots for all active sessions.

---

## 🔄 Conversation Flow

```
User sends message
       │
       ▼
┌─────────────────────┐
│ awaiting_confirmation│
└─────┬───────┬───────┘
      │ No    │ Yes
      ▼       ▼
  strategy  ┌──────────────┐
  .search() │ Parse Yes/No │
      │     └──┬───┬───┬──┘
      ▼        │   │   │
  Bot reply   Yes  No  ???
  + ask       │   │    │
  confirm     │   │    └→ Nudge: "Please reply Yes or No"
              │   │
              │   ▼
              │  increment failures
              │   │
              │   ▼
              │  ┌────────────────┐
              │  │ failures >= 2? │
              │  └──┬─────────┬──┘
              │    No         Yes
              │     │          │
              │     ▼          ▼
              │   Retry      ESCALATE
              │   search     → human agent
              ▼
          "Glad that helped!"
```

---

## 🧪 Test Coverage

The self-test (`tests/test_member1.py`) validates:

1. ✅ Initial query → resolution + confirmation prompt
2. ✅ "No" → retry with different approach (failed_attempts = 1)
3. ✅ "No" again → escalation triggered (failed_attempts = 2)
4. ✅ Unrecognized input → nudge message
5. ✅ "Yes" → success confirmation
6. ✅ `to_dict()` serialization

---

## 📁 Project Structure

```
project-auto-resolve/
├── models/
│   ├── __init__.py
│   └── chat_session.py         ← Member 1 ✅
├── services/
│   ├── __init__.py
│   └── bot_service.py          ← Member 1 ✅
├── controller/
│   ├── __init__.py
│   └── agent_controller.py    ← Member 1 ✅
├── strategies/
│   ├── __init__.py
│   └── search_strategy.py     ← Member 2 (stub)
├── routes/
│   ├── __init__.py
│   └── chat_routes.py         ← Member 3 (stub)
├── tests/
│   ├── __init__.py
│   └── test_member1.py        ← Self-test
├── app.py                     ← Member 3 (stub)
├── requirements.txt
└── README.md
```
