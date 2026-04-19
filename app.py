"""
app.py — Full FastAPI application with SQLite database and Auth routes.
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from routes.auth_routes import router as auth_router
from routes.chat_routes import router as chat_router
from routes.admin_routes import router as admin_router
from models.database import init_db

import json
import re

def seed_kb():
    from models.database import SessionLocal, DBKnowledgeEntry
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(DBKnowledgeEntry).first():
            return
            
        print("Seeding Knowledge Base from knowledgebase.js...")
        with open("knowledgebase.js", "r", encoding="utf-8") as f:
            content = f.read()
            
        # Parse the JSON array out of the JS file
        match = re.search(r"const TICKETS\s*=\s*(\[.*\]);", content, re.DOTALL)
        if match:
            json_str = match.group(1)
            tickets = json.loads(json_str)
            
            for t in tickets:
                entry = DBKnowledgeEntry(
                    ticket_id=t.get("ticket_id"),
                    category=t.get("category"),
                    operating_system=t.get("operating_system"),
                    difficulty_level=t.get("difficulty_level"),
                    severity=t.get("severity"),
                    problem_description=t.get("problem_description"),
                    escalate_if_failed=t.get("escalate_if_failed", False),
                    resolution_time_minutes=t.get("resolution_time_minutes", 0),
                )
                entry.set_json_field("keywords", t.get("keywords", []))
                entry.set_json_field("resolution_steps", t.get("resolution_steps", []))
                entry.set_json_field("user_utterances", t.get("user_utterances", []))
                entry.set_json_field("related_categories", t.get("related_categories", []))
                
                db.add(entry)
            db.commit()
            print(f"Successfully seeded {len(tickets)} KB entries.")
    except Exception as e:
        print(f"Failed to seed KB: {e}")
        db.rollback()
    finally:
        db.close()

# Initialize SQLite database tables
init_db()
seed_kb()

app = FastAPI(
    title="Project Auto-Resolve",
    description="AI-powered IT Support Chatbot with Google Auth",
    version="2.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(admin_router)

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve HTML pages
@app.get("/")
async def serve_chat():
    return FileResponse("static/index.html")

@app.get("/admin")
async def serve_admin_login():
    return FileResponse("static/admin-login.html")

@app.get("/admin/dashboard")
async def serve_admin_dashboard():
    return FileResponse("static/admin.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
