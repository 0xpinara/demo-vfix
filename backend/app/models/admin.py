"""
Admin-related database models for statistics and feedback tracking.
"""
import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.connection import Base
from app.models.user import GUID


class TechnicianFeedback(Base):
    """
    Feedback from technicians after field visits.
    Used to improve AI model and track performance.
    """
    __tablename__ = "technician_feedback"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    technician_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    chat_session_id = Column(GUID(), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Rating from technician (1-5 stars)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    
    # Diagnostic accuracy
    diagnosis_correct = Column(Boolean, default=True)
    parts_sufficient = Column(Boolean, default=True)  # Were recommended parts enough?
    second_trip_required = Column(Boolean, default=False)
    
    # Original AI recommendations
    ai_diagnosed_problem = Column(Text, nullable=True)
    ai_recommended_parts = Column(Text, nullable=True)
    ai_solution_strategy = Column(Text, nullable=True)
    
    # Actual findings (filled when diagnosis was wrong)
    actual_problem = Column(Text, nullable=True)
    actual_reason = Column(Text, nullable=True)
    actual_solution = Column(Text, nullable=True)
    actual_parts_needed = Column(Text, nullable=True)
    field_trip_was_required = Column(Boolean, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    technician = relationship("User", backref="technician_feedbacks")
    chat_session = relationship("ChatSession", backref="technician_feedback")

    __table_args__ = (
        Index('ix_technician_feedback_created', 'created_at'),
        Index('ix_technician_feedback_diagnosis', 'diagnosis_correct'),
    )

    def __repr__(self):
        return f"<TechnicianFeedback(id={self.id}, rating={self.rating}, diagnosis_correct={self.diagnosis_correct})>"


class ImprovementData(Base):
    """
    Training data collected from incorrect AI diagnoses.
    Used to improve the model in future training cycles.
    """
    __tablename__ = "improvement_data"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    technician_feedback_id = Column(GUID(), ForeignKey("technician_feedback.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Problem details
    problem_description = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    solution = Column(Text, nullable=False)
    field_trip_required = Column(Boolean, default=False)
    parts_required = Column(Text, nullable=True)
    
    # Additional context
    appliance_type = Column(String(100), nullable=True)
    appliance_brand = Column(String(100), nullable=True)
    appliance_model = Column(String(100), nullable=True)
    
    # Status for training pipeline
    used_for_training = Column(Boolean, default=False)
    training_batch_id = Column(String(100), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    technician_feedback = relationship("TechnicianFeedback", backref="improvement_data")

    __table_args__ = (
        Index('ix_improvement_data_training', 'used_for_training'),
        Index('ix_improvement_data_appliance', 'appliance_type', 'appliance_brand'),
    )

    def __repr__(self):
        return f"<ImprovementData(id={self.id}, problem={self.problem_description[:30]}...)>"
