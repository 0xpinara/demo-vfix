"""
Endpoints for fetching technician data.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
from uuid import UUID

from app import models, schemas
from app.core.dependencies import get_current_user, get_db
from app.services.repositories import UserRepository
from app.database import get_db
from app.models.user import User
from app.models.vacation import VacationType, Vacation, VacationStatus

logger = logging.getLogger(__name__)

router = APIRouter()

def require_technician(current_user: User = Depends(get_current_user)):
    """Dependency to ensure user is a technician or senior technician"""
    if current_user.enterprise_role not in ["technician", "senior_technician"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Technician access required"
        )
    return current_user


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


@router.get("/vacations", response_model=schemas.VacationListResponse)
def get_my_vacations(
    current_user: User = Depends(require_technician),
    db: Session = Depends(get_db)
):
    """
    Get list of vacations for the authenticated technician.
    """
    vacations = db.query(Vacation).filter(
        Vacation.employee_id == current_user.id
    ).order_by(Vacation.start_date.desc()).all()

    return schemas.VacationListResponse(
        vacations=vacations,
        total=len(vacations)
    )


@router.post("/vacations", response_model=schemas.VacationResponse, status_code=status.HTTP_201_CREATED)
def request_vacation(
    vacation_data: schemas.VacationRequest,
    current_user: User = Depends(require_technician),
    db: Session = Depends(get_db)
):
    """
    Request a new vacation.
    """
    # Check for overlapping vacations
    overlap = db.query(Vacation).filter(
        Vacation.employee_id == current_user.id,
        Vacation.status != VacationStatus.REJECTED,
        Vacation.status != VacationStatus.CANCELLED,
        Vacation.start_date <= vacation_data.end_date,
        Vacation.end_date >= vacation_data.start_date
    ).first()

    if overlap:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu tarihlerde başka bir izin kaydı bulunmaktadır."
        )

    new_vacation = Vacation(
        employee_id=current_user.id,
        branch_id=current_user.branch_id,
        start_date=vacation_data.start_date,
        end_date=vacation_data.end_date,
        vacation_type=vacation_data.vacation_type,
        reason=vacation_data.reason,
        status=VacationStatus.PENDING
    )

    db.add(new_vacation)
    db.commit()
    db.refresh(new_vacation)

    return new_vacation


@router.delete("/vacations/{vacation_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_vacation_request(
    vacation_id: UUID,
    current_user: User = Depends(require_technician),
    db: Session = Depends(get_db)
):
    """
    Cancel a pending vacation request.
    """
    vacation = db.query(Vacation).filter(
        Vacation.id == vacation_id,
        Vacation.employee_id == current_user.id
    ).first()

    if not vacation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İzin talebi bulunamadı."
        )

    if vacation.status != VacationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sadece beklemedeki izin talepleri iptal edilebilir."
        )

    vacation.status = VacationStatus.CANCELLED
    db.commit()

