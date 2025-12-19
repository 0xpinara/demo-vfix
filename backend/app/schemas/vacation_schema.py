"""
Vacation schemas for technician and general use.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.vacation import VacationType, VacationStatus

class VacationRequest(BaseModel):
    """Request schema for creating a new vacation"""
    start_date: datetime
    end_date: datetime
    vacation_type: VacationType = Field(default=VacationType.ANNUAL)
    reason: Optional[str] = None

    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('End date must be after start date')
        return v

class VacationResponse(BaseModel):
    """Response schema for vacation details"""
    id: UUID
    employee_id: UUID
    vacation_type: VacationType
    status: VacationStatus
    start_date: datetime
    end_date: datetime
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class VacationListResponse(BaseModel):
    """Response schema for list of vacations"""
    vacations: List[VacationResponse]
    total: int
