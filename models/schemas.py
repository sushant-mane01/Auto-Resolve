"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel
from typing import Optional, List, Any


# ---- Chat API ----

class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str


class ChatResponse(BaseModel):
    reply: str
    escalated: bool
    failed_attempts: int
    session_id: str
    sentiment: Optional[str] = None
    urgency: Optional[str] = None
    category: Optional[str] = None
    awaiting_confirmation: bool = False
    message_index: Optional[int] = None
    conversation_history: Optional[List[Any]] = None


class FeedbackRequest(BaseModel):
    session_id: str
    message_index: int
    helpful: bool


# ---- Admin API ----

class AdminLoginRequest(BaseModel):
    password: str


class AdminLoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    message: str


class TicketUpdateRequest(BaseModel):
    ticket_status: str  # open, in_progress, resolved


class KBEntryRequest(BaseModel):
    category: str
    keywords: List[str]
    resolution: str
    follow_up: str


class KBEntryUpdateRequest(BaseModel):
    category: Optional[str] = None
    keywords: Optional[List[str]] = None
    resolution: Optional[str] = None
    follow_up: Optional[str] = None


class KBTestRequest(BaseModel):
    query: str


# ---- Auth API ----

class GoogleLoginRequest(BaseModel):
    token: str

class EmailSignInRequest(BaseModel):
    email: str
    password: str

class EmailSignUpRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    success: bool
    token: str
    role: str
    name: str
    email: str
    message: str
