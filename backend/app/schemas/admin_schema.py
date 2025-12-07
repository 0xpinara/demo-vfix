"""
Schemas for admin dashboard API endpoints.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ==================== General Statistics ====================

class GeneralStatistics(BaseModel):
    """Overall platform statistics"""
    total_chats: int
    average_user_rating: float
    problems_solved_percent: float
    technician_dispatch_percent: float
    diagnosis_accuracy_percent: float
    parts_accuracy_percent: float
    average_technician_rating: float
    total_users: int
    total_technicians: int
    total_feedback_count: int


class StatisticsResponse(BaseModel):
    statistics: GeneralStatistics
    last_updated: datetime


# ==================== User Feedback ====================

class UserFeedbackItem(BaseModel):
    """Individual user feedback entry"""
    id: UUID
    user_id: UUID
    username: str
    session_id: str
    session_title: Optional[str]
    rating: int
    comment: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class UserFeedbackListResponse(BaseModel):
    """Paginated user feedback list"""
    feedback: List[UserFeedbackItem]
    total: int
    page: int
    page_size: int
    average_rating: float


# ==================== Technician Feedback ====================

class TechnicianFeedbackItem(BaseModel):
    """Individual technician feedback entry"""
    id: UUID
    technician_id: UUID
    technician_name: str
    chat_session_id: Optional[UUID]
    rating: int
    comment: Optional[str]
    diagnosis_correct: bool
    parts_sufficient: bool
    second_trip_required: bool
    ai_diagnosed_problem: Optional[str]
    ai_recommended_parts: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TechnicianFeedbackListResponse(BaseModel):
    """Paginated technician feedback list"""
    feedback: List[TechnicianFeedbackItem]
    total: int
    page: int
    page_size: int
    average_rating: float
    diagnosis_accuracy: float
    parts_accuracy: float


# ==================== Improvement Data ====================

class ImprovementDataItem(BaseModel):
    """Individual improvement data entry for training"""
    id: UUID
    problem_description: str
    reason: str
    solution: str
    field_trip_required: bool
    parts_required: Optional[str]
    appliance_type: Optional[str]
    appliance_brand: Optional[str]
    appliance_model: Optional[str]
    used_for_training: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ImprovementDataListResponse(BaseModel):
    """Paginated improvement data list"""
    data: List[ImprovementDataItem]
    total: int
    page: int
    page_size: int
    unused_for_training_count: int

