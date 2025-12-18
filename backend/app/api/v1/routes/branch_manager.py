"""
Branch Manager API routes for dashboard statistics and management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional
from datetime import datetime, timedelta
from uuid import UUID
import logging

from app.database import get_db
from app.models.user import User
from app.models.appointment import Appointment, AppointmentStatus
from app.models.admin import TechnicianFeedback
from app.models.enterprise import Branch
from app.models.vacation import Vacation, VacationStatus
from app.schemas.branch_manager_schema import (
    BranchStatisticsResponse,
    BranchStatistics,
    TechnicianRating,
    AppointmentCalendarResponse,
    AppointmentCalendarItem,
    VacationListResponse,
    VacationItem,
    TechnicianFeedbackListResponse,
    TechnicianFeedbackDetail,
    ReassignTechnicianRequest,
    BranchTechnician,
)
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


def require_branch_manager(current_user: User = Depends(get_current_user)):
    """Dependency to ensure user is a branch manager"""
    if current_user.enterprise_role != "branch_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Şube yöneticisi erişimi gerekli"
        )
    if not current_user.branch_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı bir şubeye atanmamış"
        )
    return current_user


@router.get("/statistics", response_model=BranchStatisticsResponse)
async def get_branch_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_branch_manager)
):
    """
    Get branch statistics including technician performance.
    """
    try:
        branch_id = current_user.branch_id
        
        # Get branch info
        branch = db.query(Branch).filter(Branch.id == branch_id).first()
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Şube bulunamadı"
            )
        
        # Get all technicians in the branch
        technicians = db.query(User).filter(
            User.branch_id == branch_id,
            User.enterprise_role.in_(["technician", "senior_technician"]),
            User.is_active == True
        ).all()
        
        technician_ids = [t.id for t in technicians]
        
        # Get all appointments for branch technicians
        total_appointments = db.query(func.count(Appointment.id)).filter(
            Appointment.technician_id.in_(technician_ids)
        ).scalar() or 0
        
        completed_appointments = db.query(func.count(Appointment.id)).filter(
            Appointment.technician_id.in_(technician_ids),
            Appointment.status == AppointmentStatus.COMPLETED
        ).scalar() or 0
        
        pending_appointments = db.query(func.count(Appointment.id)).filter(
            Appointment.technician_id.in_(technician_ids),
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.SCHEDULED])
        ).scalar() or 0
        
        # Get feedback statistics for branch
        total_feedbacks = db.query(func.count(TechnicianFeedback.id)).filter(
            TechnicianFeedback.technician_id.in_(technician_ids)
        ).scalar() or 0
        
        if total_feedbacks > 0:
            avg_rating_result = db.query(func.avg(TechnicianFeedback.rating)).filter(
                TechnicianFeedback.technician_id.in_(technician_ids)
            ).scalar()
            avg_rating = float(avg_rating_result) if avg_rating_result else 0.0
            
            correct_diagnosis = db.query(func.count(TechnicianFeedback.id)).filter(
                TechnicianFeedback.technician_id.in_(technician_ids),
                TechnicianFeedback.diagnosis_correct == True
            ).scalar() or 0
            diagnosis_accuracy = (correct_diagnosis / total_feedbacks) * 100
            
            sufficient_parts = db.query(func.count(TechnicianFeedback.id)).filter(
                TechnicianFeedback.technician_id.in_(technician_ids),
                TechnicianFeedback.parts_sufficient == True
            ).scalar() or 0
            parts_accuracy = (sufficient_parts / total_feedbacks) * 100
        else:
            avg_rating = 0.0
            diagnosis_accuracy = 0.0
            parts_accuracy = 0.0
        
        # Build technician ratings list
        technician_ratings = []
        for tech in technicians:
            tech_feedbacks = db.query(func.count(TechnicianFeedback.id)).filter(
                TechnicianFeedback.technician_id == tech.id
            ).scalar() or 0
            
            if tech_feedbacks > 0:
                tech_avg = db.query(func.avg(TechnicianFeedback.rating)).filter(
                    TechnicianFeedback.technician_id == tech.id
                ).scalar()
                tech_avg_rating = float(tech_avg) if tech_avg else 0.0
                
                tech_correct = db.query(func.count(TechnicianFeedback.id)).filter(
                    TechnicianFeedback.technician_id == tech.id,
                    TechnicianFeedback.diagnosis_correct == True
                ).scalar() or 0
                tech_diagnosis = (tech_correct / tech_feedbacks) * 100
                
                tech_parts = db.query(func.count(TechnicianFeedback.id)).filter(
                    TechnicianFeedback.technician_id == tech.id,
                    TechnicianFeedback.parts_sufficient == True
                ).scalar() or 0
                tech_parts_acc = (tech_parts / tech_feedbacks) * 100
            else:
                tech_avg_rating = 0.0
                tech_diagnosis = 0.0
                tech_parts_acc = 0.0
            
            technician_ratings.append(TechnicianRating(
                technician_id=tech.id,
                technician_name=tech.full_name or tech.username,
                employee_id=tech.employee_id,
                total_feedbacks=tech_feedbacks,
                average_rating=round(tech_avg_rating, 2),
                diagnosis_accuracy=round(tech_diagnosis, 1),
                parts_accuracy=round(tech_parts_acc, 1)
            ))
        
        statistics = BranchStatistics(
            branch_id=branch_id,
            branch_name=branch.name,
            total_technicians=len(technicians),
            total_appointments=total_appointments,
            completed_appointments=completed_appointments,
            pending_appointments=pending_appointments,
            average_rating=round(avg_rating, 2),
            diagnosis_accuracy=round(diagnosis_accuracy, 1),
            parts_accuracy=round(parts_accuracy, 1),
            total_feedbacks=total_feedbacks
        )
        
        return BranchStatisticsResponse(
            statistics=statistics,
            technician_ratings=technician_ratings,
            last_updated=datetime.utcnow()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching branch statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="İstatistikler alınırken bir hata oluştu"
        )


@router.get("/appointments", response_model=AppointmentCalendarResponse)
async def get_branch_appointments(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    technician_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_branch_manager)
):
    """
    Get appointments for branch calendar view.
    Highlights appointments with vacation conflicts.
    """
    try:
        branch_id = current_user.branch_id
        
        # Get all technicians in the branch
        technicians = db.query(User).filter(
            User.branch_id == branch_id,
            User.enterprise_role.in_(["technician", "senior_technician"])
        ).all()
        
        technician_ids = [t.id for t in technicians]
        technician_map = {t.id: t for t in technicians}
        
        # Build appointments query
        query = db.query(Appointment).filter(
            or_(
                Appointment.technician_id.in_(technician_ids),
                and_(
                    Appointment.technician_id.is_(None),
                    Appointment.status == AppointmentStatus.PENDING
                )
            )
        )
        
        if date_from:
            query = query.filter(Appointment.scheduled_for >= date_from)
        if date_to:
            query = query.filter(Appointment.scheduled_for <= date_to)
        if technician_id:
            query = query.filter(Appointment.technician_id == technician_id)
        
        appointments = query.order_by(Appointment.scheduled_for).all()
        
        # Get vacations for conflict detection
        vacation_query = db.query(Vacation).filter(
            Vacation.employee_id.in_(technician_ids),
            Vacation.status == VacationStatus.APPROVED
        )
        
        if date_from:
            vacation_query = vacation_query.filter(Vacation.end_date >= date_from)
        if date_to:
            vacation_query = vacation_query.filter(Vacation.start_date <= date_to)
        
        vacations = vacation_query.all()
        
        # Create vacation lookup by employee_id and dates
        def has_vacation_conflict(tech_id, appointment_date):
            if not tech_id or not appointment_date:
                return False
            for v in vacations:
                if v.employee_id == tech_id:
                    if v.start_date <= appointment_date <= v.end_date:
                        return True
            return False
        
        # Build response
        items = []
        for appt in appointments:
            tech = technician_map.get(appt.technician_id) if appt.technician_id else None
            customer = db.query(User).filter(User.id == appt.customer_id).first()
            
            items.append(AppointmentCalendarItem(
                id=appt.id,
                customer_name=customer.full_name or customer.username if customer else "Bilinmiyor",
                technician_id=appt.technician_id,
                technician_name=tech.full_name or tech.username if tech else None,
                product_brand=appt.product_brand,
                product_model=appt.product_model,
                product_issue=appt.product_issue,
                location=appt.location,
                scheduled_for=appt.scheduled_for,
                status=appt.status.value,
                has_vacation_conflict=has_vacation_conflict(appt.technician_id, appt.scheduled_for)
            ))
        
        return AppointmentCalendarResponse(
            appointments=items,
            total=len(items)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching branch appointments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Randevular alınırken bir hata oluştu"
        )


@router.get("/vacations", response_model=VacationListResponse)
async def get_branch_vacations(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    employee_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_branch_manager)
):
    """
    Get vacations for branch employees.
    """
    try:
        branch_id = current_user.branch_id
        
        # Get all employees in the branch
        employees = db.query(User).filter(
            User.branch_id == branch_id,
            User.enterprise_role.in_(["technician", "senior_technician"])
        ).all()
        
        employee_ids = [e.id for e in employees]
        employee_map = {e.id: e for e in employees}
        
        # Build vacation query
        query = db.query(Vacation).filter(
            Vacation.employee_id.in_(employee_ids)
        )
        
        if date_from:
            query = query.filter(Vacation.end_date >= date_from)
        if date_to:
            query = query.filter(Vacation.start_date <= date_to)
        if employee_id:
            query = query.filter(Vacation.employee_id == employee_id)
        
        vacations = query.order_by(Vacation.start_date).all()
        
        items = []
        for v in vacations:
            emp = employee_map.get(v.employee_id)
            items.append(VacationItem(
                id=v.id,
                employee_id=v.employee_id,
                employee_name=emp.full_name or emp.username if emp else "Bilinmiyor",
                vacation_type=v.vacation_type.value,
                status=v.status.value,
                start_date=v.start_date,
                end_date=v.end_date,
                reason=v.reason,
                notes=v.notes
            ))
        
        return VacationListResponse(
            vacations=items,
            total=len(items)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching branch vacations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="İzinler alınırken bir hata oluştu"
        )


@router.get("/technician-feedback", response_model=TechnicianFeedbackListResponse)
async def get_branch_technician_feedback(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    technician_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_branch_manager)
):
    """
    Get technician feedback for the branch.
    """
    try:
        branch_id = current_user.branch_id
        offset = (page - 1) * page_size
        
        # Get technicians in the branch
        technicians = db.query(User).filter(
            User.branch_id == branch_id,
            User.enterprise_role.in_(["technician", "senior_technician"])
        ).all()
        
        technician_ids = [t.id for t in technicians]
        technician_map = {t.id: t for t in technicians}
        
        # Build feedback query
        query = db.query(TechnicianFeedback).filter(
            TechnicianFeedback.technician_id.in_(technician_ids)
        )
        
        if technician_id:
            query = query.filter(TechnicianFeedback.technician_id == technician_id)
        
        total = query.count()
        
        # Calculate average rating
        avg_rating_result = query.with_entities(func.avg(TechnicianFeedback.rating)).scalar()
        avg_rating = float(avg_rating_result) if avg_rating_result else 0.0
        
        # Get paginated feedback
        feedbacks = query.order_by(
            TechnicianFeedback.created_at.desc()
        ).offset(offset).limit(page_size).all()
        
        items = []
        for fb in feedbacks:
            tech = technician_map.get(fb.technician_id)
            items.append(TechnicianFeedbackDetail(
                id=fb.id,
                technician_id=fb.technician_id,
                technician_name=tech.full_name or tech.username if tech else "Bilinmiyor",
                rating=fb.rating,
                comment=fb.comment,
                diagnosis_correct=fb.diagnosis_correct,
                parts_sufficient=fb.parts_sufficient,
                second_trip_required=fb.second_trip_required,
                ai_diagnosed_problem=fb.ai_diagnosed_problem,
                ai_recommended_parts=fb.ai_recommended_parts,
                actual_problem=fb.actual_problem,
                actual_solution=fb.actual_solution,
                created_at=fb.created_at
            ))
        
        return TechnicianFeedbackListResponse(
            feedback=items,
            total=total,
            page=page,
            page_size=page_size,
            average_rating=round(avg_rating, 2)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching technician feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Geri bildirimler alınırken bir hata oluştu"
        )


@router.get("/technicians", response_model=list[BranchTechnician])
async def get_branch_technicians(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_branch_manager)
):
    """
    Get list of technicians in the branch with vacation status.
    """
    try:
        branch_id = current_user.branch_id
        now = datetime.utcnow()
        
        technicians = db.query(User).filter(
            User.branch_id == branch_id,
            User.enterprise_role.in_(["technician", "senior_technician"])
        ).all()
        
        result = []
        for tech in technicians:
            # Check if on vacation
            current_vacation = db.query(Vacation).filter(
                Vacation.employee_id == tech.id,
                Vacation.status == VacationStatus.APPROVED,
                Vacation.start_date <= now,
                Vacation.end_date >= now
            ).first()
            
            result.append(BranchTechnician(
                id=tech.id,
                full_name=tech.full_name or tech.username,
                username=tech.username,
                employee_id=tech.employee_id,
                is_active=tech.is_active,
                is_on_vacation=current_vacation is not None,
                vacation_end_date=current_vacation.end_date if current_vacation else None
            ))
        
        return result
    
    except Exception as e:
        logger.error(f"Error fetching branch technicians: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Teknisyenler alınırken bir hata oluştu"
        )


@router.post("/appointments/{appointment_id}/reassign")
async def reassign_appointment(
    appointment_id: int,
    reassign_data: ReassignTechnicianRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_branch_manager)
):
    """
    Reassign a technician to an appointment.
    This is the only database modification allowed for branch managers.
    """
    try:
        branch_id = current_user.branch_id
        
        # Verify the appointment exists
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Randevu bulunamadı"
            )
        
        # Verify new technician is in the branch
        new_technician = db.query(User).filter(
            User.id == reassign_data.new_technician_id,
            User.branch_id == branch_id,
            User.enterprise_role.in_(["technician", "senior_technician"])
        ).first()
        
        if not new_technician:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Seçilen teknisyen bu şubede bulunamadı"
            )
        
        # Check if new technician is on vacation at scheduled time
        scheduled_time = reassign_data.scheduled_for or appointment.scheduled_for
        
        vacation_conflict = db.query(Vacation).filter(
            Vacation.employee_id == reassign_data.new_technician_id,
            Vacation.status == VacationStatus.APPROVED,
            Vacation.start_date <= scheduled_time,
            Vacation.end_date >= scheduled_time
        ).first()
        
        if vacation_conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Seçilen teknisyen bu tarihte izinde"
            )
        
        # Update appointment
        appointment.technician_id = reassign_data.new_technician_id
        if reassign_data.scheduled_for:
            appointment.scheduled_for = reassign_data.scheduled_for
        appointment.status = AppointmentStatus.SCHEDULED
        
        db.commit()
        db.refresh(appointment)
        
        return {
            "message": "Randevu başarıyla yeniden atandı",
            "appointment_id": appointment.id,
            "new_technician_id": str(reassign_data.new_technician_id),
            "scheduled_for": scheduled_time.isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reassigning appointment: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Randevu atanırken bir hata oluştu"
        )

