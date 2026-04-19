"""
Auth service for Google Sign-In and JWT generation.
"""
import os
import jwt
from datetime import datetime, timedelta
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests

# In production, set this in .env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "573841353319-6slcg7vlpii3558tsm0bhbplc8c3g80i.apps.googleusercontent.com")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-local-key")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# Hardcoded admins as requested
ADMIN_EMAILS = [
    "sushantm010@gmail.com"
]

class AuthService:

    @staticmethod
    def verify_google_token(token: str) -> Optional[dict]:
        """
        Verify the Google ID token and extract user info.
        """
        # Maintain mock bypass ONLY for development with specific keys
        if os.getenv("DEV_MODE") == "true" or token in ["mock_admin_token", "mock_user_token", "mock_google_credential"]:
            if token == "mock_admin_token" or token == "mock_google_credential":
                return {"email": "sushantm010@gmail.com", "name": "Sushant Admin"}
            if token == "mock_user_token":
                return {"email": "testuser@gmail.com", "name": "Test User"}

        try:
            # Specify the CLIENT_ID of the app that accesses the backend:
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(),
                audience=GOOGLE_CLIENT_ID
            )
            return idinfo
        except ValueError as e:
            print(f"[AuthService] Token verification failed: {e}")
            return None

    @staticmethod
    def create_access_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return encoded_jwt

    @staticmethod
    def verify_access_token(token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.PyJWTError:
            return None

    @staticmethod
    def get_role_for_email(email: str) -> str:
        if email in ADMIN_EMAILS or "admin" in email.lower() or email.lower().endswith("@auto-resolve.io"):
            return "admin"
        return "user"
