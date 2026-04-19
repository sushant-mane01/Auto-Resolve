"""
auth_routes.py - Router for Google Auth processing
"""
from fastapi import APIRouter, HTTPException
from models.schemas import GoogleLoginRequest, AuthResponse
from services.auth_service import AuthService
from models.database import SessionLocal, DBUser

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/google", response_model=AuthResponse)
async def google_login(request: GoogleLoginRequest):
    """
    Accepts Google ID token, verifies it, creates/updates user in DB,
    and returns a JWT spanning session + Role.
    """
    idinfo = AuthService.verify_google_token(request.token)
    if not idinfo or "email" not in idinfo:
        raise HTTPException(status_code=400, detail="Invalid Google Token")
    
    email = idinfo["email"]
    name = idinfo.get("name", "Unknown User")
    role = AuthService.get_role_for_email(email)

    db = SessionLocal()
    try:
        user = db.query(DBUser).filter(DBUser.email == email).first()
        if not user:
            user = DBUser(email=email, name=name, role=role)
            db.add(user)
        else:
            # Update name/role if changed
            user.name = name
            user.role = role
        db.commit()
    finally:
        db.close()

    # Generate JWT
    access_token = AuthService.create_access_token({
        "email": email,
        "role": role,
        "name": name
    })

    return AuthResponse(
        success=True,
        token=access_token,
        role=role,
        name=name,
        email=email,
        message="Login successful"
    )
