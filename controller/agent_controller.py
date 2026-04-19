"""
AgentController — Enhanced with SQLite persistence for User Chat History.
"""

import uuid
from typing import Any, Dict, List, Optional
import json

from models.chat_session import ChatSession
from services.bot_service import BotService
from services.analytics_service import AnalyticsService
from strategies.groq_strategy import GroqStrategy
from models.database import SessionLocal, DBChatSession

class AgentController:
    """Stateful controller with database persistence."""

    def __init__(self, strategy=None) -> None:
        self.bot_service = BotService(strategy) if strategy else None
        self.escalation_events: List[Dict[str, Any]] = []

    def _sync_to_db(self, session: ChatSession) -> None:
        """Save a ChatSession object to the database."""
        db = SessionLocal()
        try:
            db_session = db.query(DBChatSession).filter(DBChatSession.session_id == session.session_id).first()
            if not db_session:
                db_session = DBChatSession(session_id=session.session_id)
                db.add(db_session)
            
            db_session.user_email = session.user_email
            db_session.status = session.status
            db_session.category = session.category
            db_session.sentiment = session.sentiment
            db_session.urgency = session.urgency
            db_session.set_history(session.conversation_history)
            db_session.escalated = session.escalated
            db_session.failed_attempts = session.failed_attempts
            db_session.awaiting_confirmation = session.awaiting_confirmation
            db_session.ticket_id = session.ticket_id
            db_session.ticket_status = session.ticket_status
            
            db.commit()
        finally:
            db.close()

    def _load_from_db(self, session_id: str) -> Optional[ChatSession]:
        """Load a ChatSession from DB."""
        db = SessionLocal()
        try:
            db_sess = db.query(DBChatSession).filter(DBChatSession.session_id == session_id).first()
            if not db_sess:
                return None
            
            session = ChatSession(session_id)
            session.user_email = db_sess.user_email
            session.conversation_history = db_sess.get_history()
            session.status = db_sess.status
            session.category = db_sess.category
            session.sentiment = db_sess.sentiment
            session.urgency = db_sess.urgency
            session.escalated = db_sess.escalated
            session.failed_attempts = db_sess.failed_attempts
            session.awaiting_confirmation = db_sess.awaiting_confirmation
            session.ticket_id = db_sess.ticket_id
            session.ticket_status = db_sess.ticket_status
            return session
        finally:
            db.close()

    async def chat(self, session_id: Optional[str], user_text: str, user_email: Optional[str] = None) -> Dict[str, Any]:
        if not session_id:
            session_id = str(uuid.uuid4())
        
        session = self._load_from_db(session_id)
        if not session:
            session = ChatSession(session_id)
            session.user_email = user_email
            
        result = await self.bot_service.handle_message(session, user_text)
        self._sync_to_db(session)
        return result

    def add_feedback(self, session_id: str, message_index: int, helpful: bool):
        session = self._load_from_db(session_id)
        if not session:
            return {"success": False, "message": "Session not found"}
        session.add_feedback(message_index, helpful)
        self._sync_to_db(session)
        return {"success": True, "message": "Feedback recorded"}

    def get_session(self, session_id: str) -> Optional[ChatSession]:
        return self._load_from_db(session_id)

    def get_user_history(self, email: str) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            sessions = db.query(DBChatSession).filter(DBChatSession.user_email == email).order_by(DBChatSession.created_at.desc()).all()
            return [
                {
                    "session_id": s.session_id,
                    "created_at": s.created_at.isoformat(),
                    "first_message": s.get_history()[0]["text"] if s.get_history() else "New Chat",
                    "status": s.status,
                    "messages": s.get_history()
                }
                for s in sessions
            ]
        finally:
            db.close()

    def get_all_session_summaries(self) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            sessions = db.query(DBChatSession).order_by(DBChatSession.created_at.desc()).all()
            return [
                {
                    "session_id": s.session_id,
                    "status": s.status,
                    "category": s.category,
                    "sentiment": s.sentiment,
                    "urgency": s.urgency,
                    "message_count": len(s.get_history()),
                    "failed_attempts": s.failed_attempts,
                    "first_message": s.get_history()[0]["text"][:100] if s.get_history() else "N/A",
                    "messages": s.get_history(),
                    "created_at": s.created_at.isoformat(),
                    "ticket_id": s.ticket_id,
                    "ticket_status": s.ticket_status,
                }
                for s in sessions
            ]
        finally:
            db.close()

    def get_analytics(self) -> Dict[str, Any]:
        # Provide a shim since we moved to DB
        # Ideally AnalyticsService queries DB, but we keep it simple here
        db = SessionLocal()
        try:
            sessions = db.query(DBChatSession).all()
            # We reconstruct an in-memory dict for AnalyticsService
            mem_sessions = {}
            for s in sessions:
                cs = ChatSession(s.session_id)
                cs.status = s.status
                cs.category = s.category
                cs.sentiment = s.sentiment
                cs.urgency = s.urgency
                cs.escalated = s.escalated
                cs.failed_attempts = s.failed_attempts
                cs.ticket_id = s.ticket_id
                cs.ticket_status = s.ticket_status
                cs.user_email = s.user_email
                cs.created_at = s.created_at
                # Add conversation_history so AnalyticsService can use it!
                cs.conversation_history = s.get_history()
                mem_sessions[s.session_id] = cs
            return AnalyticsService.compute_stats(mem_sessions)
        finally:
            db.close()

    def update_ticket(self, ticket_id: str, new_status: str) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            db_sess = db.query(DBChatSession).filter(DBChatSession.ticket_id == ticket_id).first()
            if not db_sess:
                return {"success": False, "message": "Ticket not found"}
            session_id = db_sess.session_id
        finally:
            db.close()

        session = self._load_from_db(session_id)
        session.update_ticket_status(new_status)
        self._sync_to_db(session)
        return {"success": True, "ticket_id": session.ticket_id, "ticket_status": session.ticket_status, "session_id": session.session_id}

    async def async_generate_kb_from_session(self, session_id: str) -> None:
        """Background task to generate a KB article after a ticket is resolved."""
        try:
            print(f"[AgentController] Starting KB generation for session {session_id}")
            session = self._load_from_db(session_id)
            if not session or not session.ticket_id:
                print(f"[AgentController] No session or ticket_id found for {session_id}")
                return
                
            history = session.conversation_history  # ChatSession uses .conversation_history, not .get_history()
            print(f"[AgentController] Loaded {len(history)} messages for KB generation")
            
            if not history:
                print(f"[AgentController] No conversation history, skipping KB generation")
                return
            
            # Check if KB already exists for this ticket to prevent duplicates
            from services.admin_service import AdminService
            existing = AdminService.get_kb_entries()
            for kb in existing:
                if kb.get("ticket_id") == session.ticket_id:
                    print(f"[AgentController] KB already exists for ticket {session.ticket_id}")
                    return
                    
            # Generate new KB entry
            from strategies.groq_strategy import GroqStrategy
            strategy = GroqStrategy()
            new_entry = await strategy.generate_kb_article(
                conversation_history=history,
                ticket_id=session.ticket_id,
                category=session.category or "General"
            )
            
            if new_entry:
                AdminService.add_kb_entry(new_entry)
                print(f"[AgentController] Successfully auto-generated and added KB for {session.ticket_id}")
            else:
                print(f"[AgentController] KB generation returned None for {session.ticket_id}")
        except Exception as e:
            import traceback
            print(f"[AgentController] KB generation failed: {e}")
            traceback.print_exc()

    def _on_escalation(self, session: ChatSession) -> None:
        event = {
            "type": "escalation",
            "ticket_id": session.ticket_id,
            "session_id": session.session_id,
            "category": session.category,
            "urgency": session.urgency,
            "sentiment": session.sentiment,
            "timestamp": session.updated_at.isoformat(),
            "first_message": next((m["text"] for m in session.conversation_history if m["role"] == "user"), "N/A")[:100],
        }
        self.escalation_events.append(event)

    def pop_escalation_events(self) -> List[Dict[str, Any]]:
        events = self.escalation_events[:]
        self.escalation_events.clear()
        return events

agent_controller = AgentController(strategy=GroqStrategy())
if agent_controller.bot_service:
    agent_controller.bot_service.on_escalation = agent_controller._on_escalation
