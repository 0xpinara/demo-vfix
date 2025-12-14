"""
Enterprise API routes for organization management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app import schemas
from app.services.enterprise_service import EnterpriseService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=schemas.EnterpriseRegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_enterprise(
    user_data: schemas.EnterpriseRegister,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Register a new enterprise user with enterprise and branch.
    
    Creates:
    - Enterprise (if new)
    - Branch
    - User account with enterprise role
    """
    try:
        service = EnterpriseService(db)
        user, enterprise, branch, access_token, jti = service.register_enterprise_user(user_data, request)
        
        logger.info(f"Enterprise user registered: {user.email} ({user.enterprise_role}) in {enterprise.name}/{branch.name}")
        
        return schemas.EnterpriseRegistrationResponse(
            user=schemas.EnterpriseUserResponse.model_validate(user),
            enterprise=schemas.EnterpriseResponse.model_validate(enterprise),
            branch=schemas.BranchResponse.model_validate(branch),
            access_token=access_token,
            token_type="bearer"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Enterprise registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )



