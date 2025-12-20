from typing import Optional, List
import logging

from sqlalchemy.orm import Session

from app import models
from app.schemas.technician_schema import TechnicianFeedbackCreate

logger = logging.getLogger(__name__)


class TechnicianService:
    """Business logic for technician feedback features."""

    def __init__(self, db: Session):
        self.db = db

    def save_feedback(
        self, technician_id: str, payload: TechnicianFeedbackCreate
    ) -> models.TechnicianFeedback:
        """Create technician feedback."""
        self._validate_rating(payload.rating)
        
        # Validate that if diagnosis was incorrect, actual findings should be provided
        if not payload.diagnosis_correct:
            if not payload.actual_problem or not payload.actual_solution:
                raise ValueError(
                    "If diagnosis was incorrect, actual_problem and actual_solution are required"
                )

        feedback = models.TechnicianFeedback(
            technician_id=technician_id,
            chat_session_id=payload.chat_session_id,
            rating=payload.rating,
            comment=payload.comment,
            diagnosis_correct=payload.diagnosis_correct,
            parts_sufficient=payload.parts_sufficient,
            second_trip_required=payload.second_trip_required,
            ai_diagnosed_problem=payload.ai_diagnosed_problem,
            ai_recommended_parts=payload.ai_recommended_parts,
            ai_solution_strategy=payload.ai_solution_strategy,
            actual_problem=payload.actual_problem,
            actual_reason=payload.actual_reason,
            actual_solution=payload.actual_solution,
            actual_parts_needed=payload.actual_parts_needed,
            field_trip_was_required=payload.field_trip_was_required,
        )

        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        
        logger.info(
            "Technician feedback saved: technician_id=%s, rating=%d, diagnosis_correct=%s",
            technician_id,
            payload.rating,
            payload.diagnosis_correct,
        )
        return feedback

    def get_feedback(
        self, technician_id: str, feedback_id: str
    ) -> Optional[models.TechnicianFeedback]:
        """Get a specific feedback entry by ID (only if it belongs to the technician)."""
        return (
            self.db.query(models.TechnicianFeedback)
            .filter(
                models.TechnicianFeedback.id == feedback_id,
                models.TechnicianFeedback.technician_id == technician_id,
            )
            .first()
        )

    def list_feedback(
        self, technician_id: str, limit: int = 50
    ) -> List[models.TechnicianFeedback]:
        """List feedback entries for a technician."""
        return (
            self.db.query(models.TechnicianFeedback)
            .filter(models.TechnicianFeedback.technician_id == technician_id)
            .order_by(models.TechnicianFeedback.created_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def _validate_rating(rating: int) -> None:
        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")

