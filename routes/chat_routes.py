"""
chat_routes.py - Chat API with User history support
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from datetime import datetime, timezone
from models.schemas import ChatRequest, ChatResponse, FeedbackRequest
from controller.agent_controller import agent_controller
from services.auth_service import AuthService

router = APIRouter(prefix="/api", tags=["chat"])

def get_current_user_email(authorization: str) -> Optional[str]:
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "")
    payload = AuthService.verify_access_token(token)
    if payload and "email" in payload:
        return payload["email"]
    return None

@router.post("/chat")
async def chat_endpoint(request: ChatRequest, authorization: Optional[str] = Header(None)):
    user_email = get_current_user_email(authorization) if authorization else None
    result = await agent_controller.chat(request.session_id, request.message, user_email)
    return result

@router.post("/feedback")
async def feedback_endpoint(request: FeedbackRequest):
    result = agent_controller.add_feedback(request.session_id, request.message_index, request.helpful)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

@router.get("/chat/history")
async def get_user_chat_history(authorization: Optional[str] = Header(None)):
    email = get_current_user_email(authorization)
    if not email:
        raise HTTPException(status_code=401, detail="Authentication required to view history")
    return agent_controller.get_user_history(email)
