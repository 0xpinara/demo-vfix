from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app import schemas, models
from app.core.dependencies import get_current_user
from app.database import get_db
from app.services.chat_service import ChatService

router = APIRouter()


@router.post(
    "/feedback",
    response_model=schemas.ChatFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_feedback(
    feedback: schemas.ChatFeedbackCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update feedback for a chat session."""
    service = ChatService(db)
    try:
        saved = service.save_feedback(str(current_user.id), feedback)
        return saved
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/feedback/{session_id}",
    response_model=schemas.ChatFeedbackResponse,
    status_code=status.HTTP_200_OK,
)
async def get_feedback_for_session(
    session_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch feedback for a specific chat session belonging to the current user."""
    service = ChatService(db)
    feedback = service.get_feedback(str(current_user.id), session_id)
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found for this session",
        )
    return feedback


@router.get(
    "/feedback",
    response_model=schemas.ChatFeedbackListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_feedback(
    limit: int = Query(50, ge=1, le=200),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List recent feedback left by the current user."""
    service = ChatService(db)
    items = service.list_feedback(str(current_user.id), limit=limit)
    return {"feedback": items, "total": len(items)}


# Chat Session Endpoints
@router.post(
    "/sessions",
    response_model=schemas.ChatSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    payload: schemas.ChatSessionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new chat session."""
    service = ChatService(db)
    session = service.create_session(str(current_user.id), payload)
    return session


@router.get(
    "/sessions",
    response_model=schemas.ChatSessionListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_sessions(
    limit: int = Query(50, ge=1, le=200),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List chat sessions for the current user, sorted by created_at descending (latest first)."""
    service = ChatService(db)
    sessions = service.list_sessions(str(current_user.id), limit=limit)
    return {"sessions": sessions, "total": len(sessions)}


@router.get(
    "/sessions/{session_id}",
    response_model=schemas.ChatSessionWithMessagesResponse,
    status_code=status.HTTP_200_OK,
)
async def get_session(
    session_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a chat session with all its messages."""
    service = ChatService(db)
    session = service.get_session_with_messages(str(session_id), str(current_user.id))
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied",
        )
    
    # Manually construct response to ensure encrypted fields are decrypted
    messages = [
        schemas.ChatMessageResponse.from_orm_message(msg)
        for msg in session.messages
    ]
    
    return {
        "id": session.id,
        "user_id": session.user_id,
        "title": session.title,
        "message_count": session.message_count,
        "problem_solved": session.problem_solved,
        "technician_dispatched": session.technician_dispatched,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "ended_at": session.ended_at,
        "messages": messages,
    }


@router.put(
    "/sessions/{session_id}",
    response_model=schemas.ChatSessionResponse,
    status_code=status.HTTP_200_OK,
)
async def update_session(
    session_id: UUID,
    payload: schemas.ChatSessionUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a chat session (title, status, etc.)."""
    service = ChatService(db)
    session = service.update_session(str(session_id), str(current_user.id), payload)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied",
        )
    return session


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_session(
    session_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a chat session and all its messages."""
    service = ChatService(db)
    deleted = service.delete_session(str(session_id), str(current_user.id))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied",
        )


# Chat Message Endpoints
@router.post(
    "/sessions/{session_id}/messages",
    response_model=schemas.ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_message(
    session_id: UUID,
    payload: schemas.ChatMessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a message to a chat session."""
    service = ChatService(db)
    try:
        message = service.add_message(str(session_id), str(current_user.id), payload)
        return message
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
