from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class MessageRole(str, Enum):
    """Message role types"""
    USER = "user"
    ASSISTANT = "assistant"


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


# Chat Session Schemas
class ChatSessionBase(BaseModel):
    title: Optional[str] = Field(None, max_length=255)


class ChatSessionCreate(ChatSessionBase):
    """Payload for creating a new chat session"""
    pass


class ChatSessionUpdate(BaseModel):
    """Payload for updating a chat session"""
    title: Optional[str] = Field(None, max_length=255)
    problem_solved: Optional[bool] = None
    technician_dispatched: Optional[bool] = None
    ended_at: Optional[datetime] = None


class ChatSessionResponse(BaseModel):
    """Response model for chat session"""
    id: UUID
    user_id: UUID
    title: Optional[str]
    message_count: int
    problem_solved: bool
    technician_dispatched: bool
    created_at: datetime
    updated_at: Optional[datetime]
    ended_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ChatSessionListResponse(BaseModel):
    """Response for listing chat sessions"""
    sessions: List[ChatSessionResponse]
    total: int


# Chat Message Schemas
class ChatMessageBase(BaseModel):
    role: MessageRole
    content: Optional[str] = Field(None, max_length=10000)
    images: Optional[List[str]] = Field(None, max_items=10)  # Base64 encoded images


class ChatMessageCreate(ChatMessageBase):
    """Payload for creating a new chat message (session_id comes from URL path)"""
    pass  # session_id is provided via URL path parameter, not request body


class ChatMessageResponse(BaseModel):
    """Response model for chat message"""
    id: UUID
    session_id: UUID
    role: str
    content: Optional[str] = None
    images: Optional[List[str]] = None
    created_at: datetime

    model_config = {"from_attributes": True}
    
    @classmethod
    def from_orm_message(cls, message) -> "ChatMessageResponse":
        """Create from ORM model, explicitly accessing properties for decryption"""
        return cls(
            id=message.id,
            session_id=message.session_id,
            role=message.role,
            content=message.content,  # Use property for decryption
            images=message.images,    # Use property for decryption
            created_at=message.created_at,
        )


class ChatSessionWithMessagesResponse(ChatSessionResponse):
    """Response model for chat session with messages"""
    messages: List[ChatMessageResponse]

    model_config = {"from_attributes": True}
