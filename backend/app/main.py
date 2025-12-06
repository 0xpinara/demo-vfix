"""
V-Fix Web App Backend API
Production-ready FastAPI application with scalability features:
- Repository pattern for data access
- Service layer for business logic
- Redis caching for performance
- Logging
- Rate limiting
- Database connection pooling
- Authentication with login/register from v-fix-web
"""
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
import logging
from dotenv import load_dotenv

from app.database import get_db, engine, Base
from app import models, schemas
from app.core.security import verify_token, limiter, AUTH_RATE_LIMITS, get_rate_limit_handler, get_rate_limit_decorator
from app.services import AuthService
from app.core.logger import setup_logging
from app.core.dependencies import get_current_user
from app.api.v1.routes import chat

load_dotenv()

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Create tables (in production, use Alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="V-Fix Web App API",
    version="1.0.0",
    description="Home Appliance VLM Platform API with Authentication",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Initialize rate limiting
app = get_rate_limit_handler(app)

# Add GZip compression for responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Comprehensive health check endpoint.
    
    Checks:
    - API availability
    - Database connectivity
    - Cache availability
    """
    from app.core.cache import cache
    from datetime import datetime
    
    health_status = {
        "status": "ok",
        "service": "V-Fix Web App API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    # Database check
    try:
        db.execute(text("SELECT 1"))
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
        logger.error(f"Database health check failed: {e}")
    
    # Cache check
    try:
        test_key = "_health_check"
        cache.set(test_key, "test", ttl=10)
        result = cache.get(test_key)
        cache.delete(test_key)
        health_status["checks"]["cache"] = "healthy" if result else "unavailable"
    except Exception as e:
        health_status["checks"]["cache"] = "unavailable"
        logger.warning(f"Cache health check failed: {e}")
    
    return health_status


@app.get("/metrics")
async def metrics(db: Session = Depends(get_db)):
    """
    Basic metrics endpoint for monitoring.
    
    Returns application metrics for observability.
    """
    from app.services.repositories import UserRepository
    from datetime import datetime, timedelta
    
    user_repo = UserRepository(db)
    
    # Calculate metrics
    try:
        active_users_count = len(user_repo.get_active_users(limit=10000))
        
        # Last 24 hours user registrations
        # This is a simplified version - in production, add proper indexes and queries
        recent_users = user_repo.get_active_users(limit=1000)
        day_ago = datetime.utcnow() - timedelta(days=1)
        new_users_24h = len([u for u in recent_users if u.created_at and u.created_at > day_ago])
        
        metrics_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": {
                "active_users": active_users_count,
                "new_users_24h": new_users_24h
            }
        }
        
        return metrics_data
    except Exception as e:
        logger.error(f"Metrics collection failed: {e}")
        return {"error": "Failed to collect metrics"}


@app.post("/api/auth/register", response_model=schemas.RegisterResponse, status_code=status.HTTP_201_CREATED)
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
        if "already exists" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )


@app.post("/api/auth/login", response_model=schemas.TokenResponse)
@get_rate_limit_decorator(AUTH_RATE_LIMITS["login"])
async def login(request: Request, credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password.
    
    Returns JWT access token on successful authentication.
    """
    try:
        auth_service = AuthService(db)
        user, access_token, jti = auth_service.login_user(credentials.email, credentials.password, request)
        
        logger.info(f"User logged in: {user.email}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except ValueError as e:
        error_message = str(e)
        # Check for specific error types
        if "inactive" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive"
            )
        elif "locked" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_message  # Return the specific lockout message
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )


@app.post("/api/auth/google", response_model=schemas.TokenResponse)
async def google_login(google_data: schemas.GoogleLogin, db: Session = Depends(get_db)):
    # In a real implementation, you would verify the Google token here
    # For now, we'll return an error for invalid tokens
    if not google_data.token or len(google_data.token) < 10:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    # TODO: Implement actual Google OAuth verification
    # For now, this is a placeholder that would need Google OAuth integration
    # You would decode the token, get user info, and create/update user in DB
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Google OAuth integration not yet implemented"
    )


@app.post("/api/auth/guest", response_model=schemas.TokenResponse)
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
            detail="Product barcode not found or invalid."
        )


@app.post("/api/auth/password-reset")
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
        "message": "If an account with this email exists, a password reset link has been sent."
    }


@app.post("/api/auth/logout")
async def logout(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout and revoke current session"""
    # Get token ID from JWT
    from app.core.security import verify_token
    from app.services.repositories import SessionRepository
    
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = verify_token(token)
    
    if payload and payload.get("jti"):
        session_repo = SessionRepository(db)
        session = session_repo.get_by_token_id(payload.get("jti"))
        if session:
            session_repo.revoke_session(str(session.id), str(current_user.id))
    
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Successfully logged out"}


@app.get("/api/users/me", response_model=schemas.UserResponse)
@get_rate_limit_decorator("100/hour")  # Stricter limit for authenticated endpoints
async def get_current_user_info(request: Request, current_user: models.User = Depends(get_current_user)):
    """Get current authenticated user information."""
    logger.debug(f"User info requested: {current_user.email}")
    return schemas.UserResponse.model_validate(current_user)


# Session Management Endpoints
@app.get("/api/auth/sessions", response_model=schemas.SessionsListResponse)
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
    from app.core.security import verify_token
    
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


@app.delete("/api/auth/sessions/{session_id}")
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
            detail="Session not found"
        )
    
    logger.info(f"Session {session_id} revoked by user {current_user.email}")
    return {"message": "Session revoked successfully"}


@app.post("/api/auth/sessions/revoke-all")
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
    from app.core.security import verify_token
    
    # Get current session token ID
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = verify_token(token)
    current_jti = payload.get("jti") if payload else None
    
    auth_service = AuthService(db)
    count = auth_service.revoke_all_sessions(str(current_user.id), exclude_token_id=current_jti)
    
    logger.info(f"User {current_user.email} revoked {count} sessions")
    return {
        "message": f"Revoked {count} session(s)",
        "revoked_count": count
    }


# Login History Endpoint
@app.get("/api/auth/login-history", response_model=schemas.LoginHistoryListResponse)
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


# Chat and feedback endpoints
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

# TODO: Appointments, Technicians, Admin endpoints will be added by team
# from app.api.v1.routes import appointments, technicians, admin
# app.include_router(appointments.router, prefix="/api/v1/appointments", tags=["Appointments"])
# app.include_router(technicians.router, prefix="/api/v1/technicians", tags=["Technicians"])
# app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
