import uuid
import json
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.connection import Base
from app.models.user import GUID, User
from app.core.encryption import encrypt_field, decrypt_field


class ChatSession(Base):
    """
    Tracks chat sessions between users and the chatbot.
    Sessions are sorted by created_at (latest first).
    """
    __tablename__ = "chat_sessions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_key = Column(String(255), unique=True, nullable=True, index=True)  # Legacy field, can be null for new sessions
    title = Column(String(255), nullable=True)
    message_count = Column(Integer, default=0)
    problem_solved = Column(Boolean, default=False)
    technician_dispatched = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

    __table_args__ = (
        Index('ix_chat_sessions_user_created', 'user_id', 'created_at'),
    )

    def __repr__(self):
        return f"<ChatSession(id={self.id}, user_id={self.user_id}, title={self.title})>"


class ChatMessage(Base):
    """
    Stores individual chat messages with encrypted content and images.
    Messages are encrypted at rest for privacy.
    """
    __tablename__ = "chat_messages"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    session_id = Column(GUID(), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    _content = Column("content", Text, nullable=True)  # Encrypted message content
    _images = Column("images", Text, nullable=True)  # Encrypted JSON array of base64 images
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    session = relationship("ChatSession", back_populates="messages")

    __table_args__ = (
        Index('ix_chat_messages_session_created', 'session_id', 'created_at'),
    )

    @property
    def content(self):
        """Decrypt content when reading"""
        if self._content:
            return decrypt_field(self._content)
        return None

    @content.setter
    def content(self, value):
        """Encrypt content when writing"""
        if value:
            self._content = encrypt_field(value)
        else:
            self._content = None

    @property
    def images(self):
        """Decrypt and parse images when reading"""
        if self._images:
            decrypted = decrypt_field(self._images)
            try:
                return json.loads(decrypted) if decrypted else []
            except json.JSONDecodeError:
                return []
        return []

    @images.setter
    def images(self, value):
        """Encrypt images when writing"""
        if value and isinstance(value, list) and len(value) > 0:
            encrypted = encrypt_field(json.dumps(value))
            self._images = encrypted
        else:
            self._images = None

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, session_id={self.session_id}, role={self.role})>"


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
