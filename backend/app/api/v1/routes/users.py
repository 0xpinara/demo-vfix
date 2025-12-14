"""
User endpoints for V-Fix API
"""
from fastapi import APIRouter, Depends, Request
import logging

from app import models, schemas
from app.core.dependencies import get_current_user
from app.core.security import get_rate_limit_decorator

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/me", response_model=schemas.UserResponse)
@get_rate_limit_decorator("100/hour")  # Stricter limit for authenticated endpoints
async def get_current_user_info(request: Request, current_user: models.User = Depends(get_current_user)):
    """Get current authenticated user information."""
    logger.debug(f"User info requested: {current_user.email}")
    return schemas.UserResponse.model_validate(current_user)

