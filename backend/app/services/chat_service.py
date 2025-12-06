from typing import Optional, List
import logging

from sqlalchemy.orm import Session

from app import models
from app.schemas import ChatFeedbackCreate
from app.services.repositories import ChatFeedbackRepository

logger = logging.getLogger(__name__)


class ChatService:
    """Business logic for chat-related features (feedback, transcripts, etc.)."""

    def __init__(self, db: Session):
        self.db = db
        self.feedback_repo = ChatFeedbackRepository(db)

    def save_feedback(self, user_id: str, payload: ChatFeedbackCreate) -> models.ChatFeedback:
        """Create or update feedback for a chat session."""
        self._validate_rating(payload.rating)
        feedback = self.feedback_repo.upsert(
            user_id=user_id,
            session_id=payload.session_id,
            rating=payload.rating,
            comment=payload.comment,
            session_title=payload.session_title,
        )
        logger.info("Feedback saved for user %s session %s", user_id, payload.session_id)
        return feedback

    def get_feedback(self, user_id: str, session_id: str) -> Optional[models.ChatFeedback]:
        return self.feedback_repo.get_by_user_and_session(user_id, session_id)

    def list_feedback(self, user_id: str, limit: int = 50) -> List[models.ChatFeedback]:
        return self.feedback_repo.list_for_user(user_id, limit=limit)

    @staticmethod
    def _validate_rating(rating: int) -> None:
        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")
