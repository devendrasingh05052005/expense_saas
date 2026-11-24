import datetime
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, EmailVerification
from app.schemas.user import (
    UserRegister, UserVerifyOTP, ResendOTP, UserLogin,
    ForgotPasswordRequest, ResetPasswordRequest, UserResponse, TokenResponse
)
from app.utils.security import (
    get_password_hash, verify_password, create_access_token, generate_otp
)
from app.services.email_service import send_otp_email, get_latest_dev_otp
from app.utils.dependencies import get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

AVATAR_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#f97316", "#eab308", "#10b981", "#06b6d4",
    "#3b82f6", "#14b8a6"
]

@router.post("/register")
def register(req: UserRegister, db: Session = Depends(get_db)):
    # 1. Validate password match
    if req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )
    
    # 2. Check if user already exists
    normalized_email = req.email.lower().strip()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    
    if existing_user and existing_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in."
        )
    
    # If user exists but is unverified, update name and password
    if existing_user and not existing_user.is_verified:
        existing_user.full_name = req.full_name.strip()
        existing_user.hashed_password = get_password_hash(req.password)
        user = existing_user
    else:
        # Create new unverified user
        user = User(
            email=normalized_email,
            full_name=req.full_name.strip(),
            hashed_password=get_password_hash(req.password),
            is_verified=False,
            avatar_color=random.choice(AVATAR_COLORS)
        )
        db.add(user)
        
    db.commit()
    db.refresh(user)
    
    # Invalidate previous unused OTPs for this email
    db.query(EmailVerification).filter(
        EmailVerification.email == normalized_email,
        EmailVerification.purpose == "registration"
    ).update({"is_used": True})
    
    # Generate 6-digit OTP
    otp_code = generate_otp()
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    
    ev = EmailVerification(
        email=normalized_email,
        otp_code=otp_code,
        purpose="registration",
        expires_at=expires_at,
        is_used=False
    )
    db.add(ev)
    db.commit()
    
    # Send email / log OTP
    send_otp_email(normalized_email, otp_code, purpose="registration")
    
    return {
        "message": f"Registration initiated. A 6-digit verification code has been sent to {normalized_email}.",
        "email": normalized_email
    }

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(req: UserVerifyOTP, db: Session = Depends(get_db)):
    normalized_email = req.email.lower().strip()
    now = datetime.datetime.utcnow()
    
    # Find latest valid OTP
    ev = db.query(EmailVerification).filter(
        EmailVerification.email == normalized_email,
        EmailVerification.purpose == "registration",
        EmailVerification.is_used == False
    ).order_by(EmailVerification.id.desc()).first()
    
    if not ev:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending verification code found. Please request a new one."
        )
        
    if ev.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )
        
    if ev.attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many invalid attempts. Please request a new code."
        )
        
    if ev.otp_code != req.otp_code.strip():
        ev.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check your email and try again."
        )
        
    # Mark OTP used
    ev.is_used = True
    
    # Activate user
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    user.is_verified = True
    db.commit()
    db.refresh(user)
    
    # Generate Access Token
    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/resend-otp")
def resend_otp(req: ResendOTP, db: Session = Depends(get_db)):
    normalized_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="No account registered with this email.")
        
    # Rate limiting: check if an OTP was issued in the last 45 seconds
    recent = db.query(EmailVerification).filter(
        EmailVerification.email == normalized_email,
        EmailVerification.purpose == req.purpose,
        EmailVerification.created_at >= datetime.datetime.utcnow() - datetime.timedelta(seconds=45)
    ).first()
    
    if recent:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait 45 seconds before requesting another code."
        )
        
    # Invalidate previous
    db.query(EmailVerification).filter(
        EmailVerification.email == normalized_email,
        EmailVerification.purpose == req.purpose
    ).update({"is_used": True})
    
    otp_code = generate_otp()
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    
    ev = EmailVerification(
        email=normalized_email,
        otp_code=otp_code,
        purpose=req.purpose,
        expires_at=expires_at,
        is_used=False
    )
    db.add(ev)
    db.commit()
    
    send_otp_email(normalized_email, otp_code, purpose=req.purpose)
    
    return {
        "message": f"A new verification code has been sent to {normalized_email}."
    }

@router.post("/login", response_model=TokenResponse)
def login(req: UserLogin, db: Session = Depends(get_db)):
    normalized_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password."
        )
        
    if not user.is_verified:
        # Trigger an OTP send so they can complete verification
        otp_code = generate_otp()
        ev = EmailVerification(
            email=normalized_email,
            otp_code=otp_code,
            purpose="registration",
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
            is_used=False
        )
        db.add(ev)
        db.commit()
        send_otp_email(normalized_email, otp_code, purpose="registration")
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address not verified. A verification code has been sent to your email."
        )
        
    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    normalized_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()
    
    if not user:
        # For security, return success message even if email doesn't exist
        return {"message": "If an account with this email exists, a password reset code has been sent."}
        
    otp_code = generate_otp()
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    
    ev = EmailVerification(
        email=normalized_email,
        otp_code=otp_code,
        purpose="password_reset",
        expires_at=expires_at,
        is_used=False
    )
    db.add(ev)
    db.commit()
    
    send_otp_email(normalized_email, otp_code, purpose="password_reset")
    
    return {
        "message": "If an account with this email exists, a password reset code has been sent."
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )
        
    normalized_email = req.email.lower().strip()
    now = datetime.datetime.utcnow()
    
    ev = db.query(EmailVerification).filter(
        EmailVerification.email == normalized_email,
        EmailVerification.purpose == "password_reset",
        EmailVerification.is_used == False
    ).order_by(EmailVerification.id.desc()).first()
    
    if not ev or ev.expires_at < now or ev.otp_code != req.otp_code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code. Please request a new code."
        )
        
    ev.is_used = True
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    
    return {"message": "Password has been successfully reset. Please log in with your new password."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


