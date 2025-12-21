from typing import Optional, List
import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app import models
from app.schemas import ChatFeedbackCreate, ChatSessionCreate, ChatSessionUpdate, ChatMessageCreate
from app.services.repositories import ChatFeedbackRepository, ChatSessionRepository, ChatMessageRepository

logger = logging.getLogger(__name__)


class ChatService:
    """Business logic for chat-related features (sessions, messages, feedback, etc.)."""

    def __init__(self, db: Session):
        self.db = db
        self.feedback_repo = ChatFeedbackRepository(db)
        self.session_repo = ChatSessionRepository(db)
        self.message_repo = ChatMessageRepository(db)

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

    # Chat Session Methods
    def create_session(self, user_id: str, payload: ChatSessionCreate) -> models.ChatSession:
        """Create a new chat session"""
        session = self.session_repo.create(user_id=user_id, title=payload.title)
        logger.info("Chat session created: %s for user %s", session.id, user_id)
        return session

    def get_session(self, session_id: str, user_id: str) -> Optional[models.ChatSession]:
        """Get a session by ID with messages"""
        return self.session_repo.get_by_id(session_id, user_id)

    def list_sessions(self, user_id: str, limit: int = 50) -> List[models.ChatSession]:
        """List sessions for a user, sorted by created_at descending (latest first)"""
        return self.session_repo.list_for_user(user_id, limit=limit)

    def update_session(
        self, session_id: str, user_id: str, payload: ChatSessionUpdate
    ) -> Optional[models.ChatSession]:
        """Update a session"""
        update_data = payload.model_dump(exclude_unset=True)
        session = self.session_repo.update(session_id, user_id, **update_data)
        if session:
            logger.info("Chat session updated: %s", session_id)
        return session

    def delete_session(self, session_id: str, user_id: str) -> bool:
        """Delete a session and all its messages"""
        deleted = self.session_repo.delete(session_id, user_id)
        if deleted:
            logger.info("Chat session deleted: %s", session_id)
        return deleted

    # Chat Message Methods
    def add_message(
        self, session_id: str, user_id: str, payload: ChatMessageCreate
    ) -> Optional[models.ChatMessage]:
        """Add a message to a session"""
        # Verify session belongs to user
        session = self.session_repo.get_by_id(session_id, user_id)
        if not session:
            raise ValueError("Session not found or access denied")

        message = self.message_repo.create(
            session_id=session_id,
            role=payload.role.value,
            content=payload.content,
            images=payload.images,
        )
        
        # Increment message count
        self.session_repo.increment_message_count(session_id)
        
        logger.info("Message added to session %s", session_id)
        return message

    def get_session_with_messages(
        self, session_id: str, user_id: str
    ) -> Optional[models.ChatSession]:
        """Get a session with all its messages"""
        session = self.session_repo.get_by_id(session_id, user_id)
        if session:
            # Messages are loaded via relationship - trigger lazy load and access properties to decrypt
            messages = session.messages
            # Access content and images properties to trigger decryption
            for msg in messages:
                _ = msg.content  # Trigger decryption
                _ = msg.images   # Trigger decryption
        return session
