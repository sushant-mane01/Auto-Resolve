"""
admin_routes.py — FastAPI router for admin API (JWT protected).
"""
import asyncio
import json
from fastapi import APIRouter, HTTPException, Header, Request
from fastapi.responses import StreamingResponse
from typing import Optional

from models.schemas import TicketUpdateRequest, KBEntryRequest, KBEntryUpdateRequest, KBTestRequest
from controller.agent_controller import agent_controller
# Discarding old AdminService, using AuthService for Role-based auth
from services.auth_service import AuthService
from services.admin_service import AdminService # Keep for KB operations for now
from strategies.llm_strategy import LLMStrategy

router = APIRouter(prefix="/api/admin", tags=["admin"])

def require_admin(authorization: Optional[str] = Header(None)):
    """Validate admin JWT from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token")
    
    token = authorization.replace("Bearer ", "")
    payload = AuthService.verify_access_token(token)
    
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    return payload

@router.get("/analytics")
async def get_analytics(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    return agent_controller.get_analytics()

@router.get("/sessions")
async def get_sessions(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    return agent_controller.get_all_session_summaries()

@router.get("/sessions/{session_id}")
async def get_session_detail(session_id: str, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    session = agent_controller.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict()

@router.get("/tickets")
async def get_tickets(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    analytics = agent_controller.get_analytics()
    return analytics.get("tickets", [])

from fastapi import BackgroundTasks

@router.put("/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, request: TicketUpdateRequest, background_tasks: BackgroundTasks, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    result = agent_controller.update_ticket(ticket_id, request.ticket_status)
    print(f"DEBUG: update_ticket args=({repr(ticket_id)}, {repr(request.ticket_status)}) => {result}")
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
        
    if request.ticket_status == "resolved":
        background_tasks.add_task(agent_controller.async_generate_kb_from_session, result["session_id"])
        
    return result

# KB Routes
@router.get("/kb")
async def get_kb(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    return AdminService.get_kb_entries()

@router.post("/kb")
async def add_kb_entry(request: KBEntryRequest, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    return AdminService.add_kb_entry(request.model_dump())

@router.put("/kb/{entry_id}")
async def update_kb_entry(entry_id: int, request: KBEntryUpdateRequest, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    result = AdminService.update_kb_entry(entry_id, request.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(status_code=404, detail="KB entry not found")
    return result

@router.delete("/kb/{entry_id}")
async def delete_kb_entry(entry_id: int, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    success = AdminService.delete_kb_entry(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="KB entry not found")
    return {"success": True, "message": "Entry deleted"}

@router.post("/kb/test")
async def test_kb_query(request: KBTestRequest, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    strategy = LLMStrategy()
    result = await strategy.search(request.query, [])
    return result

@router.get("/events")
async def sse_events(authorization: Optional[str] = None):
    if authorization:
        require_admin(authorization)

    async def event_generator():
        while True:
            events = agent_controller.pop_escalation_events()
            for event in events:
                yield f"data: {json.dumps(event)}\n\n"
            yield ": heartbeat\n\n"
            await asyncio.sleep(2)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
