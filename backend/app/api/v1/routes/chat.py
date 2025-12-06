from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

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
