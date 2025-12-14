from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import verify_token
from app.database import get_db
from app import models
from app.services.repositories import SessionRepository
from datetime import datetime


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Dependency that validates the Authorization header and returns
    the authenticated user.
    """
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    user_id = payload.get("sub")
    jti = payload.get("jti")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    # Validate session if jti is present
    if jti:
        session_repo = SessionRepository(db)
        session = session_repo.get_by_token_id(jti)
        if not session or not session.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or revoked"
            )
        # Check if session is expired
        if session.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired"
            )
        # Update last used timestamp
        session_repo.update_last_used(session)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user


# ============================================================================
# ENTERPRISE RBAC DEPENDENCIES
# ============================================================================

def require_enterprise_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Dependency to ensure user belongs to an enterprise"""
    if not current_user.enterprise_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Enterprise access required"
        )
    return current_user


def require_enterprise_admin(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Dependency to ensure user is an enterprise admin"""
    if not current_user.enterprise_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Enterprise access required"
        )
    if current_user.enterprise_role != "enterprise_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Enterprise admin access required"
        )
    return current_user


def require_branch_manager(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Dependency to ensure user is a branch manager or higher"""
    if not current_user.enterprise_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Enterprise access required"
        )
    if current_user.enterprise_role not in ["branch_manager", "enterprise_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Branch manager access required"
        )
    return current_user


def require_technician(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Dependency to ensure user is a technician or higher"""
    if not current_user.enterprise_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Enterprise access required"
        )
    valid_roles = ["technician", "senior_technician", "branch_manager", "enterprise_admin"]
    if current_user.enterprise_role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Technician access required"
        )
    return current_user


def require_senior_technician(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Dependency to ensure user is a senior technician or higher"""
    if not current_user.enterprise_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Enterprise access required"
        )
    valid_roles = ["senior_technician", "branch_manager", "enterprise_admin"]
    if current_user.enterprise_role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Senior technician access required"
        )
    return current_user
