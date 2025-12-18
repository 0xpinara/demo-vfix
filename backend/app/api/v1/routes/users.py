"""
User endpoints for V-Fix API
"""
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app import models, schemas
from app.core.dependencies import get_current_user, get_db
from app.core.security import get_rate_limit_decorator
from app.services.repositories import UserRepository


logger = logging.getLogger(__name__)

router = APIRouter()


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


@router.get("/me", response_model=schemas.UserResponse)
@get_rate_limit_decorator("100/hour")
async def get_current_user_info(request: Request, current_user: models.User = Depends(get_current_user)):
    """Get current authenticated user information."""
    logger.debug(f"User info requested: {current_user.email}")
    return schemas.UserResponse.model_validate(current_user)

@router.get("/", response_model=List[schemas.UserResponse])
def get_all_users(
    current_user: models.User = Depends(get_current_user),
    repo: UserRepository = Depends(get_user_repository),
    skip: int = 0,
    limit: int = 100
):
    """
    Get a list of all users. Accessible only by admins and technicians.
    Technicians use this to select a customer when creating an appointment.
    """
    user_role = getattr(current_user, 'enterprise_role', getattr(current_user, 'role', ''))
    if user_role not in ["admin", "technician"] and current_user.role not in ["admin", "technician"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view all users."
        )
    
    # For now, technicians get all users with the 'user' role.
    # This could be refined to only show users within the same enterprise.
    users = repo.get_by_role('user', skip=skip, limit=limit)
    return users
