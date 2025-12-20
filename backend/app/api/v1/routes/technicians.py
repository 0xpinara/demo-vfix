"""
Endpoints for fetching technician data and submitting feedback.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
from uuid import UUID

from app import models, schemas
from app.core.dependencies import get_current_user, get_db, require_technician
from app.services.repositories import UserRepository
from app.services.technician_service import TechnicianService
from app.database import get_db
from app.models.user import User
from app.models.vacation import VacationType, Vacation, VacationStatus

logger = logging.getLogger(__name__)

router = APIRouter()


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    """Dependency to get user repository."""
    return UserRepository(db)

@router.get("/", response_model=List[schemas.UserResponse])
def get_all_technicians(
    current_user: models.User = Depends(get_current_user),
    repo: UserRepository = Depends(get_user_repository),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    date: str = None
):
    """
    Get a list of all active technicians.
    Optional 'date' parameter filters out technicians who have an APPROVED vacation on that date.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be logged in to view technicians."
        )
    
    technicians = repo.get_by_enterprise_role('technician', skip=skip, limit=limit)
    senior_technicians = repo.get_by_enterprise_role('senior_technician', skip=skip, limit=limit)
    all_technicians = technicians + senior_technicians

    if date:
        try:
            from datetime import datetime
            
            # Using basic string parsing, assuming ISO format or YYYY-MM-DD
            # Backend usually expects ISO format from frontend datetime-local (e.g., 2025-12-19T10:00)
            check_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
            
            # Find technicians with approved vacations on this date
            busy_technician_ids = db.query(Vacation.employee_id).filter(
                Vacation.status == VacationStatus.APPROVED,
                Vacation.start_date <= check_date,
                Vacation.end_date >= check_date
            ).all()
            
            busy_ids = {id[0] for id in busy_technician_ids}
            
            # Filter out busy technicians
            all_technicians = [tech for tech in all_technicians if tech.id not in busy_ids]
            
        except ValueError:
             # If date parsing fails, log it but don't crash, or raise 400
             # For now, let's ignore filtering if date is invalid
             pass

    return all_technicians


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


# ==================== Technician Feedback ====================

@router.post(
    "/feedback",
    response_model=schemas.TechnicianFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_feedback(
    feedback_data: schemas.TechnicianFeedbackCreate,
    current_user: User = Depends(require_technician),
    db: Session = Depends(get_db),
):
    """Submit technician feedback after a field visit."""
    service = TechnicianService(db)
    try:
        saved = service.save_feedback(str(current_user.id), feedback_data)
        return saved
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/feedback",
    response_model=List[schemas.TechnicianFeedbackResponse],
    status_code=status.HTTP_200_OK,
)
def list_my_feedback(
    limit: int = 50,
    current_user: User = Depends(require_technician),
    db: Session = Depends(get_db),
):
    """List feedback entries submitted by the current technician."""
    service = TechnicianService(db)
    items = service.list_feedback(str(current_user.id), limit=limit)
    return items


@router.get(
    "/feedback/{feedback_id}",
    response_model=schemas.TechnicianFeedbackResponse,
    status_code=status.HTTP_200_OK,
)
def get_feedback(
    feedback_id: UUID,
    current_user: User = Depends(require_technician),
    db: Session = Depends(get_db),
):
    """Get a specific feedback entry by ID."""
    service = TechnicianService(db)
    feedback = service.get_feedback(str(current_user.id), str(feedback_id))
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found",
        )
    return feedback

