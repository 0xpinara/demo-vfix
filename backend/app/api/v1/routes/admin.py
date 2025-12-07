"""
Admin API routes for dashboard statistics and data management.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional
from datetime import datetime
import logging

from app.database import get_db
from app.models.user import User
from app.models.chat_session import ChatFeedback
from app.models.admin import ChatSession, TechnicianFeedback, ImprovementData
from app.schemas.admin_schema import (
    StatisticsResponse,
    GeneralStatistics,
    UserFeedbackListResponse,
    UserFeedbackItem,
    TechnicianFeedbackListResponse,
    TechnicianFeedbackItem,
    ImprovementDataListResponse,
    ImprovementDataItem,
)
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency to ensure user is admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/statistics", response_model=StatisticsResponse)
async def get_general_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get general platform statistics for admin dashboard.
    """
    try:
        # Total chats
        total_chats = db.query(func.count(ChatSession.id)).scalar() or 0
        
        # Average user rating from ChatFeedback
        avg_user_rating_result = db.query(func.avg(ChatFeedback.rating)).scalar()
        avg_user_rating = float(avg_user_rating_result) if avg_user_rating_result else 0.0
        
        # Problems solved percentage
        if total_chats > 0:
            solved_count = db.query(func.count(ChatSession.id)).filter(
                ChatSession.problem_solved == True
            ).scalar() or 0
            problems_solved_percent = (solved_count / total_chats) * 100
        else:
            problems_solved_percent = 0.0
        
        # Technician dispatch percentage
        if total_chats > 0:
            dispatched_count = db.query(func.count(ChatSession.id)).filter(
                ChatSession.technician_dispatched == True
            ).scalar() or 0
            technician_dispatch_percent = (dispatched_count / total_chats) * 100
        else:
            technician_dispatch_percent = 0.0
        
        # Technician feedback stats
        total_tech_feedback = db.query(func.count(TechnicianFeedback.id)).scalar() or 0
        
        if total_tech_feedback > 0:
            # Diagnosis accuracy
            correct_diagnosis = db.query(func.count(TechnicianFeedback.id)).filter(
                TechnicianFeedback.diagnosis_correct == True
            ).scalar() or 0
            diagnosis_accuracy_percent = (correct_diagnosis / total_tech_feedback) * 100
            
            # Parts accuracy
            sufficient_parts = db.query(func.count(TechnicianFeedback.id)).filter(
                TechnicianFeedback.parts_sufficient == True
            ).scalar() or 0
            parts_accuracy_percent = (sufficient_parts / total_tech_feedback) * 100
            
            # Average technician rating
            avg_tech_rating_result = db.query(func.avg(TechnicianFeedback.rating)).scalar()
            avg_tech_rating = float(avg_tech_rating_result) if avg_tech_rating_result else 0.0
        else:
            diagnosis_accuracy_percent = 0.0
            parts_accuracy_percent = 0.0
            avg_tech_rating = 0.0
        
        # User counts
        total_users = db.query(func.count(User.id)).filter(User.role == "user").scalar() or 0
        total_technicians = db.query(func.count(User.id)).filter(User.role == "technician").scalar() or 0
        total_feedback_count = db.query(func.count(ChatFeedback.id)).scalar() or 0
        
        statistics = GeneralStatistics(
            total_chats=total_chats,
            average_user_rating=round(avg_user_rating, 2),
            problems_solved_percent=round(problems_solved_percent, 1),
            technician_dispatch_percent=round(technician_dispatch_percent, 1),
            diagnosis_accuracy_percent=round(diagnosis_accuracy_percent, 1),
            parts_accuracy_percent=round(parts_accuracy_percent, 1),
            average_technician_rating=round(avg_tech_rating, 2),
            total_users=total_users,
            total_technicians=total_technicians,
            total_feedback_count=total_feedback_count
        )
        
        return StatisticsResponse(
            statistics=statistics,
            last_updated=datetime.utcnow()
        )
    
    except Exception as e:
        logger.error(f"Error fetching statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch statistics"
        )


@router.get("/user-feedback", response_model=UserFeedbackListResponse)
async def get_user_feedback(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get paginated list of user feedback for admin review.
    """
    try:
        # Calculate offset
        offset = (page - 1) * page_size
        
        # Get total count
        total = db.query(func.count(ChatFeedback.id)).scalar() or 0
        
        # Get average rating
        avg_rating_result = db.query(func.avg(ChatFeedback.rating)).scalar()
        avg_rating = float(avg_rating_result) if avg_rating_result else 0.0
        
        # Get paginated feedback with user info
        feedback_query = db.query(
            ChatFeedback,
            User.username
        ).join(
            User, ChatFeedback.user_id == User.id
        ).order_by(
            ChatFeedback.created_at.desc()
        ).offset(offset).limit(page_size).all()
        
        feedback_items = []
        for feedback, username in feedback_query:
            feedback_items.append(UserFeedbackItem(
                id=feedback.id,
                user_id=feedback.user_id,
                username=username,
                session_id=feedback.session_id,
                session_title=feedback.session_title,
                rating=feedback.rating,
                comment=feedback.comment,
                created_at=feedback.created_at
            ))
        
        return UserFeedbackListResponse(
            feedback=feedback_items,
            total=total,
            page=page,
            page_size=page_size,
            average_rating=round(avg_rating, 2)
        )
    
    except Exception as e:
        logger.error(f"Error fetching user feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user feedback"
        )


@router.get("/technician-feedback", response_model=TechnicianFeedbackListResponse)
async def get_technician_feedback(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get paginated list of technician feedback for admin review.
    """
    try:
        # Calculate offset
        offset = (page - 1) * page_size
        
        # Get total count
        total = db.query(func.count(TechnicianFeedback.id)).scalar() or 0
        
        # Get statistics
        if total > 0:
            avg_rating_result = db.query(func.avg(TechnicianFeedback.rating)).scalar()
            avg_rating = float(avg_rating_result) if avg_rating_result else 0.0
            
            correct_count = db.query(func.count(TechnicianFeedback.id)).filter(
                TechnicianFeedback.diagnosis_correct == True
            ).scalar() or 0
            diagnosis_accuracy = (correct_count / total) * 100
            
            parts_count = db.query(func.count(TechnicianFeedback.id)).filter(
                TechnicianFeedback.parts_sufficient == True
            ).scalar() or 0
            parts_accuracy = (parts_count / total) * 100
        else:
            avg_rating = 0.0
            diagnosis_accuracy = 0.0
            parts_accuracy = 0.0
        
        # Get paginated feedback with technician info
        feedback_query = db.query(
            TechnicianFeedback,
            User.full_name,
            User.username
        ).join(
            User, TechnicianFeedback.technician_id == User.id
        ).order_by(
            TechnicianFeedback.created_at.desc()
        ).offset(offset).limit(page_size).all()
        
        feedback_items = []
        for feedback, full_name, username in feedback_query:
            feedback_items.append(TechnicianFeedbackItem(
                id=feedback.id,
                technician_id=feedback.technician_id,
                technician_name=full_name or username,
                chat_session_id=feedback.chat_session_id,
                rating=feedback.rating,
                comment=feedback.comment,
                diagnosis_correct=feedback.diagnosis_correct,
                parts_sufficient=feedback.parts_sufficient,
                second_trip_required=feedback.second_trip_required,
                ai_diagnosed_problem=feedback.ai_diagnosed_problem,
                ai_recommended_parts=feedback.ai_recommended_parts,
                created_at=feedback.created_at
            ))
        
        return TechnicianFeedbackListResponse(
            feedback=feedback_items,
            total=total,
            page=page,
            page_size=page_size,
            average_rating=round(avg_rating, 2),
            diagnosis_accuracy=round(diagnosis_accuracy, 1),
            parts_accuracy=round(parts_accuracy, 1)
        )
    
    except Exception as e:
        logger.error(f"Error fetching technician feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch technician feedback"
        )


@router.get("/improvement-data", response_model=ImprovementDataListResponse)
async def get_improvement_data(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unused_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get paginated list of improvement data for model training.
    """
    try:
        # Calculate offset
        offset = (page - 1) * page_size
        
        # Base query
        query = db.query(ImprovementData)
        
        if unused_only:
            query = query.filter(ImprovementData.used_for_training == False)
        
        # Get total count
        total = query.count()
        
        # Get unused count
        unused_count = db.query(func.count(ImprovementData.id)).filter(
            ImprovementData.used_for_training == False
        ).scalar() or 0
        
        # Get paginated data
        data_query = query.order_by(
            ImprovementData.created_at.desc()
        ).offset(offset).limit(page_size).all()
        
        data_items = []
        for item in data_query:
            data_items.append(ImprovementDataItem(
                id=item.id,
                problem_description=item.problem_description,
                reason=item.reason,
                solution=item.solution,
                field_trip_required=item.field_trip_required,
                parts_required=item.parts_required,
                appliance_type=item.appliance_type,
                appliance_brand=item.appliance_brand,
                appliance_model=item.appliance_model,
                used_for_training=item.used_for_training,
                created_at=item.created_at
            ))
        
        return ImprovementDataListResponse(
            data=data_items,
            total=total,
            page=page,
            page_size=page_size,
            unused_for_training_count=unused_count
        )
    
    except Exception as e:
        logger.error(f"Error fetching improvement data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch improvement data"
        )

