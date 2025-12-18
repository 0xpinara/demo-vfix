"""
Endpoints for fetching technician data.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app import models, schemas
from app.core.dependencies import get_current_user, get_db
from app.services.repositories import UserRepository

logger = logging.getLogger(__name__)

router = APIRouter()

def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    """Dependency to get user repository."""
    return UserRepository(db)

@router.get("/", response_model=List[schemas.UserResponse])
def get_all_technicians(
    current_user: models.User = Depends(get_current_user),
    repo: UserRepository = Depends(get_user_repository),
    skip: int = 0,
    limit: int = 100
):
    """
    Get a list of all active technicians.
    This is a public endpoint for authenticated users to be able to select a technician.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be logged in to view technicians."
        )
    
    technicians = repo.get_by_enterprise_role('technician', skip=skip, limit=limit)
    senior_technicians = repo.get_by_enterprise_role('senior_technician', skip=skip, limit=limit)
    return technicians + senior_technicians
