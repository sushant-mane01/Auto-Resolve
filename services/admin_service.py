"""
AdminService — Handles admin authentication, KB CRUD, and ticket management.
"""

import os
import uuid
from typing import Any, Dict, List, Optional

from models.database import SessionLocal, DBKnowledgeEntry

# In-memory admin token store
_admin_tokens: Dict[str, bool] = {}

# Admin password from env or default
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")


class AdminService:
    """Admin operations: auth, KB management, ticket management."""

    # ------------------------------------------------------------------
    #  Authentication
    # ------------------------------------------------------------------

    @staticmethod
    def login(password: str) -> Dict[str, Any]:
        """Validate admin password and return a session token."""
        if password == ADMIN_PASSWORD:
            token = str(uuid.uuid4())
            _admin_tokens[token] = True
            return {"success": True, "token": token, "message": "Login successful"}
        return {"success": False, "token": None, "message": "Invalid password"}

    @staticmethod
    def validate_token(token: str) -> bool:
        """Check if a token is valid."""
        return _admin_tokens.get(token, False)

    @staticmethod
    def logout(token: str) -> bool:
        """Invalidate a token."""
        return _admin_tokens.pop(token, False)

    # ------------------------------------------------------------------
    #  Knowledge Base CRUD
    # ------------------------------------------------------------------

    @staticmethod
    def _entry_to_dict(entry: DBKnowledgeEntry) -> Dict[str, Any]:
        return {
            "id": entry.id,
            "ticket_id": entry.ticket_id,
            "category": entry.category,
            "operating_system": entry.operating_system,
            "difficulty_level": entry.difficulty_level,
            "severity": entry.severity,
            "problem_description": entry.problem_description,
            "escalate_if_failed": entry.escalate_if_failed,
            "resolution_time_minutes": entry.resolution_time_minutes,
            
            # JSON lists
            "keywords": entry.get_json_field("keywords"),
            "resolution_steps": entry.get_json_field("resolution_steps"),
            "user_utterances": entry.get_json_field("user_utterances"),
            "related_categories": entry.get_json_field("related_categories"),
        }

    @staticmethod
    def get_kb_entries() -> List[Dict[str, Any]]:
        """Return all KB entries from the database."""
        db = SessionLocal()
        try:
            entries = db.query(DBKnowledgeEntry).all()
            return [AdminService._entry_to_dict(e) for e in entries]
        finally:
            db.close()

    @staticmethod
    def get_kb_entry(entry_id: int) -> Optional[Dict[str, Any]]:
        """Return a single KB entry by ID."""
        db = SessionLocal()
        try:
            entry = db.query(DBKnowledgeEntry).filter(DBKnowledgeEntry.id == entry_id).first()
            if entry:
                return AdminService._entry_to_dict(entry)
            return None
        finally:
            db.close()

    @staticmethod
    def add_kb_entry(entry_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new KB entry."""
        db = SessionLocal()
        try:
            entry = DBKnowledgeEntry(
                ticket_id=entry_data.get("ticket_id", ""),
                category=entry_data.get("category", "General"),
                operating_system=entry_data.get("operating_system", "all"),
                difficulty_level=entry_data.get("difficulty_level", "low"),
                severity=entry_data.get("severity", "P3"),
                problem_description=entry_data.get("problem_description", ""),
                escalate_if_failed=entry_data.get("escalate_if_failed", False),
                resolution_time_minutes=entry_data.get("resolution_time_minutes", 10),
            )
            # Array features
            entry.set_json_field("keywords", entry_data.get("keywords", []))
            entry.set_json_field("resolution_steps", entry_data.get("resolution_steps", []))
            entry.set_json_field("user_utterances", entry_data.get("user_utterances", []))
            entry.set_json_field("related_categories", entry_data.get("related_categories", []))
            
            db.add(entry)
            db.commit()
            db.refresh(entry)
            return AdminService._entry_to_dict(entry)
        finally:
            db.close()

    @staticmethod
    def update_kb_entry(entry_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing KB entry."""
        db = SessionLocal()
        try:
            entry = db.query(DBKnowledgeEntry).filter(DBKnowledgeEntry.id == entry_id).first()
            if not entry:
                return None
                
            # Straight string/int attributes
            for attr in ['ticket_id', 'category', 'operating_system', 'difficulty_level', 
                         'severity', 'problem_description', 'escalate_if_failed', 'resolution_time_minutes']:
                if attr in updates:
                    setattr(entry, attr, updates[attr])
                    
            # JSON array attributes
            for attr in ['keywords', 'resolution_steps', 'user_utterances', 'related_categories']:
                if attr in updates:
                    entry.set_json_field(attr, updates[attr])
                    
            db.commit()
            db.refresh(entry)
            return AdminService._entry_to_dict(entry)
        finally:
            db.close()

    @staticmethod
    def delete_kb_entry(entry_id: int) -> bool:
        """Delete a KB entry by ID."""
        db = SessionLocal()
        try:
            entry = db.query(DBKnowledgeEntry).filter(DBKnowledgeEntry.id == entry_id).first()
            if entry:
                db.delete(entry)
                db.commit()
                return True
            return False
        finally:
            db.close()
