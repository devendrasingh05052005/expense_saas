import os
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if url:
        # Normalize postgres:// to postgresql:// for modern SQLAlchemy
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url
    if os.getenv("VERCEL"):
        return "sqlite:////tmp/roommates.db"
    return "sqlite:///./roommates.db"

class Settings(BaseModel):
    PROJECT_NAME: str = "RoomMates SaaS"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-roommates-saas-2026-very-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: Supports SQLite by default or PostgreSQL via DATABASE_URL
    DATABASE_URL: str = get_database_url()
    
    # SMTP Email Settings (optional - if omitted, OTP is logged to console and returned in test mode)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "noreply@roommates.app")
    EMAILS_FROM_NAME: str = os.getenv("EMAILS_FROM_NAME", "RoomMates App")
    
    # OTP Expiry in minutes
    OTP_EXPIRE_MINUTES: int = 5
    
    # Dev / Demo mode: disabled for production security
    DEV_MODE: bool = os.getenv("DEV_MODE", "False").lower() in ("true", "1", "t")

settings = Settings()
