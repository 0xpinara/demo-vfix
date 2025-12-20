from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class TechnicianFeedbackCreate(BaseModel):
    """Payload for creating technician feedback"""
    chat_session_id: Optional[UUID] = None
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    comment: Optional[str] = Field(None, max_length=2000)
    
    # Diagnostic accuracy
    diagnosis_correct: bool = Field(default=True)
    parts_sufficient: bool = Field(default=True)
    second_trip_required: bool = Field(default=False)
    
    # Original AI recommendations (optional - can be filled from chat session)
    ai_diagnosed_problem: Optional[str] = Field(None, max_length=1000)
    ai_recommended_parts: Optional[str] = Field(None, max_length=1000)
    ai_solution_strategy: Optional[str] = Field(None, max_length=1000)
    
    # Actual findings (required if diagnosis was incorrect)
    actual_problem: Optional[str] = Field(None, max_length=1000)
    actual_reason: Optional[str] = Field(None, max_length=1000)
    actual_solution: Optional[str] = Field(None, max_length=1000)
    actual_parts_needed: Optional[str] = Field(None, max_length=1000)
    field_trip_was_required: Optional[bool] = None


class TechnicianFeedbackResponse(BaseModel):
    """Response model for technician feedback"""
    id: UUID
    technician_id: UUID
    chat_session_id: Optional[UUID]
    rating: int
    comment: Optional[str]
    diagnosis_correct: bool
    parts_sufficient: bool
    second_trip_required: bool
    ai_diagnosed_problem: Optional[str]
    ai_recommended_parts: Optional[str]
    ai_solution_strategy: Optional[str]
    actual_problem: Optional[str]
    actual_reason: Optional[str]
    actual_solution: Optional[str]
    actual_parts_needed: Optional[str]
    field_trip_was_required: Optional[bool]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}

