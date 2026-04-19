"""
Database configuration and SQLAlchemy models.
"""
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./auto_resolve.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class DBUser(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=True)
    role = Column(String, default="user")  # "user" or "admin"
    created_at = Column(DateTime, default=datetime.utcnow)


class DBChatSession(Base):
    __tablename__ = "chat_sessions"

    session_id = Column(String, primary_key=True, index=True)
    user_email = Column(String, index=True)
    
    # Overview Data
    status = Column(String, default="active")
    category = Column(String, nullable=True)
    sentiment = Column(String, default="neutral")
    urgency = Column(String, default="low")
    
    # Store Conversation as raw JSON string
    conversation_history = Column(Text, default="[]")
    
    escalated = Column(Boolean, default=False)
    failed_attempts = Column(Integer, default=0)
    awaiting_confirmation = Column(Boolean, default=False)
    ticket_id = Column(String, nullable=True)
    ticket_status = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_history(self, history_list):
        self.conversation_history = json.dumps(history_list)

    def get_history(self):
        try:
            return json.loads(self.conversation_history)
        except:
            return []

class DBKnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(String, index=True)
    category = Column(String)
    operating_system = Column(String)
    difficulty_level = Column(String)
    severity = Column(String)
    
    # Store lists as JSON strings
    keywords = Column(Text, default="[]")
    problem_description = Column(Text)
    resolution_steps = Column(Text, default="[]")
    user_utterances = Column(Text, default="[]")
    
    escalate_if_failed = Column(Boolean, default=False)
    related_categories = Column(Text, default="[]")
    resolution_time_minutes = Column(Integer, default=0)

    def set_json_field(self, field_name, value):
        setattr(self, field_name, json.dumps(value))

    def get_json_field(self, field_name):
        try:
            return json.loads(getattr(self, field_name))
        except:
            return []

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
