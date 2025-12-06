import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.connection import Base
from app.models.user import GUID, User


class ChatFeedback(Base):
    """
    Stores per-session chat feedback from users.
    Each user can rate a session once (upsertable).
    """
    __tablename__ = "chat_feedback"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(255), nullable=False, index=True)
    session_title = Column(String(255), nullable=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", backref="chat_feedback")

    __table_args__ = (
        Index("ix_chat_feedback_user_session", "user_id", "session_id", unique=True),
    )

    def __repr__(self):
        return f"<ChatFeedback(user_id={self.user_id}, session_id={self.session_id}, rating={self.rating})>"
