"""
Schemas for branch manager dashboard and statistics.
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class TechnicianRating(BaseModel):
    """Rating statistics for a single technician"""
    technician_id: UUID
    technician_name: str
    employee_id: Optional[str] = None
    total_feedbacks: int
    average_rating: float
    diagnosis_accuracy: float
    parts_accuracy: float


class BranchStatistics(BaseModel):
    """Overall branch statistics"""
    branch_id: UUID
    branch_name: str
    total_technicians: int
    total_appointments: int
    completed_appointments: int
    pending_appointments: int
    average_rating: float
    diagnosis_accuracy: float
    parts_accuracy: float
    total_feedbacks: int


class BranchStatisticsResponse(BaseModel):
    """Response for branch statistics endpoint"""
    statistics: BranchStatistics
    technician_ratings: List[TechnicianRating]
    last_updated: datetime


class AppointmentCalendarItem(BaseModel):
    """Appointment item for calendar display"""
    id: int
    customer_name: str
    technician_id: Optional[UUID] = None
    technician_name: Optional[str] = None
    product_brand: str
    product_model: str
    product_issue: str
    location: str
    scheduled_for: datetime
    status: str
    has_vacation_conflict: bool = False


class AppointmentCalendarResponse(BaseModel):
    """Response for appointment calendar"""
    appointments: List[AppointmentCalendarItem]
    total: int


class VacationItem(BaseModel):
    """Vacation item for calendar display"""
    id: UUID
    employee_id: UUID
    employee_name: str
    vacation_type: str
    status: str
    start_date: datetime
    end_date: datetime
    reason: Optional[str] = None
    notes: Optional[str] = None


class VacationListResponse(BaseModel):
    """Response for vacation list"""
    vacations: List[VacationItem]
    total: int


class TechnicianFeedbackDetail(BaseModel):
    """Detailed technician feedback for branch manager view"""
    id: UUID
    technician_id: UUID
    technician_name: str
    rating: int
    comment: Optional[str] = None
    diagnosis_correct: bool
    parts_sufficient: bool
    second_trip_required: bool
    ai_diagnosed_problem: Optional[str] = None
    ai_recommended_parts: Optional[str] = None
    actual_problem: Optional[str] = None
    actual_solution: Optional[str] = None
    created_at: datetime


class TechnicianFeedbackListResponse(BaseModel):
    """Response for technician feedback list"""
    feedback: List[TechnicianFeedbackDetail]
    total: int
    page: int
    page_size: int
    average_rating: float


class ReassignTechnicianRequest(BaseModel):
    """Request to reassign a technician to an appointment"""
    new_technician_id: UUID
    scheduled_for: Optional[datetime] = None  # Optional reschedule


class BranchTechnician(BaseModel):
    """Technician info for branch manager"""
    id: UUID
    full_name: str
    username: str
    employee_id: Optional[str] = None
    is_active: bool
    is_on_vacation: bool = False
    vacation_end_date: Optional[datetime] = None

