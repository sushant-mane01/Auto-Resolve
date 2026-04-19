"""
auth_routes.py - Router for Google Auth and Email/Password Auth
"""
from fastapi import APIRouter, HTTPException
from models.schemas import GoogleLoginRequest, EmailSignInRequest, EmailSignUpRequest, AuthResponse
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

@router.post("/signin", response_model=AuthResponse)
async def email_signin(request: EmailSignInRequest):
    """Sign in with email and password."""
    db = SessionLocal()
    try:
        user = db.query(DBUser).filter(DBUser.email == request.email).first()
        if not user or not user.check_password(request.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        role = AuthService.get_role_for_email(user.email)
        # Update role if admin list changed
        if user.role != role:
            user.role = role
            db.commit()

        access_token = AuthService.create_access_token({
            "email": user.email,
            "role": role,
            "name": user.name or user.email.split("@")[0]
        })

        return AuthResponse(
            success=True,
            token=access_token,
            role=role,
            name=user.name or user.email.split("@")[0],
            email=user.email,
            message="Login successful"
        )
    finally:
        db.close()

@router.post("/signup", response_model=AuthResponse)
async def email_signup(request: EmailSignUpRequest):
    """Create a new account with email and password."""
    db = SessionLocal()
    try:
        existing = db.query(DBUser).filter(DBUser.email == request.email).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        
        name = request.email.split("@")[0].replace(".", " ").replace("_", " ").title()
        role = AuthService.get_role_for_email(request.email)
        
        user = DBUser(email=request.email, name=name, role=role)
        user.set_password(request.password)
        db.add(user)
        db.commit()

        access_token = AuthService.create_access_token({
            "email": user.email,
            "role": role,
            "name": name
        })

        return AuthResponse(
            success=True,
            token=access_token,
            role=role,
            name=name,
            email=user.email,
            message="Account created successfully"
        )
    finally:
        db.close()
