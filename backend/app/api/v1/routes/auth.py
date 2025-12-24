"""
Authentication endpoints for V-Fix API
Includes registration, login, logout, session management, and login history
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import logging

from app import models, schemas
from app.database import get_db
from app.core.security import verify_token, AUTH_RATE_LIMITS, get_rate_limit_decorator
from app.core.dependencies import get_current_user
from app.services import AuthService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=schemas.RegisterResponse, status_code=status.HTTP_201_CREATED)
@get_rate_limit_decorator(AUTH_RATE_LIMITS["register"])
async def register(request: Request, user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    - **email**: Valid email address (unique)
    - **username**: Username (unique, 3-50 characters)
    - **password**: Strong password (min 8 chars, at least 1 digit and 1 letter)
    - **gdpr_consent**: Must be true
    - **age_verified**: User age verification status
    """
    try:
        auth_service = AuthService(db)
        user, access_token, jti = auth_service.register_user(user_data, request)
        
        logger.info(f"User registered: {user.email}")
        
        return {
            "user": schemas.UserResponse.model_validate(user),
            "access_token": access_token,
            "token_type": "bearer"
        }
    except ValueError as e:
        if "already exists" in str(e) or "kullanılıyor" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )


@router.post("/login", response_model=schemas.TokenResponse)
@get_rate_limit_decorator(AUTH_RATE_LIMITS["login"])
async def login(request: Request, credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Login with email/username and password.
    
    Returns JWT access token on successful authentication.
    """
    try:
        auth_service = AuthService(db)
        user, access_token, jti = auth_service.login_user(credentials.email, credentials.password, request)
        
        logger.info(f"User logged in: {user.email} (role: {user.role})")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": user.role,
            "enterprise_id": str(user.enterprise_id) if user.enterprise_id else None,
            "enterprise_role": user.enterprise_role
        }
    except ValueError as e:
        error_message = str(e)
        # Check for specific error types
        if "inactive" in error_message.lower() or "aktif değil" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Hesap aktif değil"
            )
        elif "locked" in error_message.lower() or "kilitlendi" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_message  # Return the specific lockout message
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz e-posta veya şifre"
            )
    except Exception as e:
        # Catch all other exceptions to prevent 500 errors
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login işlemi sırasında bir hata oluştu: {str(e)}"
        )


@router.post("/google", response_model=schemas.TokenResponse)
async def google_login(google_data: schemas.GoogleLogin, db: Session = Depends(get_db)):
    # In a real implementation, you would verify the Google token here
    # For now, we'll return an error for invalid tokens
    if not google_data.token or len(google_data.token) < 10:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz Google token"
        )
    
    # TODO: Implement actual Google OAuth verification
    # For now, this is a placeholder that would need Google OAuth integration
    # You would decode the token, get user info, and create/update user in DB
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Google OAuth entegrasyonu henüz uygulanmadı"
    )


@router.post("/guest", response_model=schemas.TokenResponse)
@get_rate_limit_decorator(AUTH_RATE_LIMITS["guest_login"])
async def guest_login(request: Request, guest_data: schemas.GuestLogin, db: Session = Depends(get_db)):
    """
    Guest login with product barcode.
    
    Creates temporary guest account for accessing product-specific features.
    """
    try:
        auth_service = AuthService(db)
        user, access_token, jti = auth_service.guest_login(guest_data.barcode, request)
        
        logger.info(f"Guest logged in with barcode: {guest_data.barcode}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": "guest"
        }
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ürün barkodu bulunamadı veya geçersiz."
        )


@router.post("/password-reset")
@get_rate_limit_decorator(AUTH_RATE_LIMITS["password_reset"])
async def password_reset(request: Request, reset_request: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Request password reset link.
    
    Always returns success to prevent email enumeration.
    In production, sends email with reset token.
    """
    auth_service = AuthService(db)
    token = auth_service.create_password_reset_token(reset_request.email)
    
    # Always return success to prevent email enumeration
    logger.info(f"Password reset requested for: {reset_request.email}")
    
    return {
        "message": "Bu e-posta ile bir hesap varsa, şifre sıfırlama bağlantısı gönderildi."
    }


@router.post("/logout")
async def logout(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout and revoke current session"""
    # Get token ID from JWT
    from app.services.repositories import SessionRepository
    
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = verify_token(token)
    
    if payload and payload.get("jti"):
        session_repo = SessionRepository(db)
        session = session_repo.get_by_token_id(payload.get("jti"))
        if session:
            session_repo.revoke_session(str(session.id), str(current_user.id))
    
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Başarıyla çıkış yapıldı"}


# Session Management Endpoints
@router.get("/sessions", response_model=schemas.SessionsListResponse)
@get_rate_limit_decorator("30/hour")
async def get_sessions(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all active sessions for the current user.
    
    Returns list of all active sessions with device information.
    """
    auth_service = AuthService(db)
    sessions = auth_service.get_user_sessions(str(current_user.id))
    
    # Get current session token ID from Authorization header
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""
    payload = verify_token(token)
    current_jti = payload.get("jti") if payload else None
    
    session_responses = []
    for session in sessions:
        session_responses.append(schemas.SessionResponse(
            id=session.id,
            device_name=session.device_name,
            user_agent=session.user_agent,
            ip_address=session.ip_address,
            is_active=session.is_active,
            created_at=session.created_at,
            last_used_at=session.last_used_at,
            expires_at=session.expires_at,
            is_current=(session.token_id == current_jti) if current_jti else False
        ))
    
    return {
        "sessions": session_responses,
        "total": len(session_responses),
        "active_count": len([s for s in session_responses if s.is_active])
    }


@router.delete("/sessions/{session_id}")
@get_rate_limit_decorator("10/hour")
async def revoke_session(
    request: Request,
    session_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke a specific session.
    
    Users can revoke any of their own sessions.
    """
    auth_service = AuthService(db)
    success = auth_service.revoke_session(session_id, str(current_user.id))
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oturum bulunamadı"
        )
    
    logger.info(f"Session {session_id} revoked by user {current_user.email}")
    return {"message": "Oturum başarıyla iptal edildi"}


@router.post("/sessions/revoke-all")
@get_rate_limit_decorator("5/hour")
async def revoke_all_sessions(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke all sessions except the current one.
    
    Useful for security when user suspects account compromise.
    """
    # Get current session token ID
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = verify_token(token)
    current_jti = payload.get("jti") if payload else None
    
    auth_service = AuthService(db)
    count = auth_service.revoke_all_sessions(str(current_user.id), exclude_token_id=current_jti)
    
    logger.info(f"User {current_user.email} revoked {count} sessions")
    return {
        "message": f"{count} oturum iptal edildi",
        "revoked_count": count
    }


# Login History Endpoint
@router.get("/login-history", response_model=schemas.LoginHistoryListResponse)
@get_rate_limit_decorator("30/hour")
async def get_login_history(
    request: Request,
    limit: int = 50,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get login history for the current user.
    
    Returns recent login attempts (successful and failed) with:
    - IP address
    - Device information
    - Timestamp
    - Success/failure status
    """
    auth_service = AuthService(db)
    history = auth_service.get_login_history(str(current_user.id), limit=limit)
    
    history_responses = []
    successful_count = 0
    failed_count = 0
    
    for entry in history:
        history_responses.append(schemas.LoginHistoryResponse(
            id=entry.id,
            email=entry.email,
            success=entry.success,
            ip_address=entry.ip_address,
            user_agent=entry.user_agent,
            device_name=entry.device_name,
            failure_reason=entry.failure_reason,
            created_at=entry.created_at
        ))
        if entry.success:
            successful_count += 1
        else:
            failed_count += 1
    
    return {
        "history": history_responses,
        "total": len(history_responses),
        "successful_count": successful_count,
        "failed_count": failed_count
    }

