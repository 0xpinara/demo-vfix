from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ChatFeedbackBase(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=255)
    # Allow service-layer validation to control the error code (400 instead of 422)
    rating: int
    comment: Optional[str] = Field(None, max_length=2000)
    session_title: Optional[str] = Field(None, max_length=255)


class ChatFeedbackCreate(ChatFeedbackBase):
    """Payload for creating or updating chat feedback"""


class ChatFeedbackResponse(BaseModel):
    id: UUID
    session_id: str
    session_title: Optional[str]
    rating: int
    comment: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ChatFeedbackListResponse(BaseModel):
    feedback: List[ChatFeedbackResponse]
    total: int
