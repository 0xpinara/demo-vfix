"""
Repository pattern for data access with caching support.
Abstracts database operations for better testing and scalability.
"""
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app import models
from app.models import User, Product, PasswordResetToken, UserSession, LoginHistory, ChatFeedback, Appointment
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class UserRepository:
    """Repository for User model operations with optimized queries"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, user_id: str) -> Optional[models.User]:
        """Get user by ID with query optimization"""
        return self.db.query(models.User).filter(
            models.User.id == user_id
        ).first()
    
    def get_by_email(self, email: str) -> Optional[models.User]:
        """Get user by email (indexed query)"""
        return self.db.query(models.User).filter(
            models.User.email == email
        ).first()
    
    def get_by_username(self, username: str) -> Optional[models.User]:
        """Get user by username (indexed query)"""
        return self.db.query(models.User).filter(
            models.User.username == username
        ).first()
    
    def get_by_google_id(self, google_id: str) -> Optional[models.User]:
        """Get user by Google ID (indexed query)"""
        return self.db.query(models.User).filter(
            models.User.google_id == google_id
        ).first()
    
    def exists_by_email_or_username(self, email: str, username: str) -> bool:
        """Check if user exists by email or username (optimized)"""
        return self.db.query(models.User).filter(
            or_(models.User.email == email, models.User.username == username)
        ).first() is not None
    
    def get_active_users(self, skip: int = 0, limit: int = 100) -> List[models.User]:
        """Get paginated list of active users (uses composite index)"""
        return self.db.query(models.User).filter(
            models.User.is_active == True
        ).order_by(
            models.User.created_at.desc()
        ).offset(skip).limit(limit).all()
    
    def get_by_role(self, role: str, skip: int = 0, limit: int = 100) -> List[models.User]:
        """Get users by role (uses composite index)"""
        return self.db.query(models.User).filter(
            models.User.role == role,
            models.User.is_active == True
        ).order_by(
            models.User.created_at.desc()
        ).offset(skip).limit(limit).all()
    
    def get_by_enterprise_role(self, role: str, skip: int = 0, limit: int = 100) -> List[models.User]:
        """Get users by enterprise role (uses composite index)"""
        return self.db.query(models.User).filter(
            models.User.enterprise_role == role,
            models.User.is_active == True
        ).order_by(
            models.User.created_at.desc()
        ).offset(skip).limit(limit).all()
    
    def create(self, user: models.User) -> models.User:
        """Create new user"""
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        logger.info(f"Created user: {user.email}")
        return user
    
    def update(self, user: models.User) -> models.User:
        """Update existing user"""
        self.db.commit()
        self.db.refresh(user)
        logger.info(f"Updated user: {user.email}")
        return user
    
    def delete(self, user: models.User) -> None:
        """Soft delete user"""
        user.is_active = False
        self.db.commit()
        logger.info(f"Deactivated user: {user.email}")
    
    def hard_delete(self, user: models.User) -> None:
        """Hard delete user (use with caution)"""
        self.db.delete(user)
        self.db.commit()
        logger.warning(f"Hard deleted user: {user.email}")


class ProductRepository:
    """Repository for Product model operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, product_id: str) -> Optional[models.Product]:
        """Get product by ID"""
        return self.db.query(models.Product).filter(
            models.Product.id == product_id
        ).first()
    
    def get_by_barcode(self, barcode: str) -> Optional[models.Product]:
        """Get product by barcode (indexed query)"""
        return self.db.query(models.Product).filter(
            models.Product.barcode == barcode
        ).first()
    
    def get_by_brand(self, brand: str, skip: int = 0, limit: int = 100) -> List[models.Product]:
        """Get products by brand (uses index)"""
        return self.db.query(models.Product).filter(
            models.Product.brand == brand
        ).offset(skip).limit(limit).all()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[models.Product]:
        """Get paginated list of products"""
        return self.db.query(models.Product).order_by(
            models.Product.created_at.desc()
        ).offset(skip).limit(limit).all()
    
    def create(self, product: models.Product) -> models.Product:
        """Create new product"""
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        logger.info(f"Created product: {product.barcode}")
        return product
    
    def delete(self, product: models.Product) -> None:
        """Delete product"""
        self.db.delete(product)
        self.db.commit()
        logger.info(f"Deleted product: {product.barcode}")


class PasswordResetTokenRepository:
    """Repository for PasswordResetToken model operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_token(self, token: str) -> Optional[models.PasswordResetToken]:
        """Get reset token by token string (indexed query)"""
        return self.db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.token == token,
            models.PasswordResetToken.used == False
        ).first()
    
    def get_by_user_id(self, user_id: str) -> List[models.PasswordResetToken]:
        """Get all reset tokens for a user (indexed query)"""
        return self.db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.user_id == user_id
        ).order_by(
            models.PasswordResetToken.created_at.desc()
        ).all()
    
    def create(self, reset_token: models.PasswordResetToken) -> models.PasswordResetToken:
        """Create new reset token"""
        self.db.add(reset_token)
        self.db.commit()
        self.db.refresh(reset_token)
        logger.info(f"Created password reset token for user: {reset_token.user_id}")
        return reset_token
    
    def mark_as_used(self, reset_token: models.PasswordResetToken) -> models.PasswordResetToken:
        """Mark reset token as used"""
        reset_token.used = True
        self.db.commit()
        self.db.refresh(reset_token)
        logger.info(f"Marked password reset token as used: {reset_token.token}")
        return reset_token
    
    def cleanup_expired(self) -> int:
        """Delete expired reset tokens (uses composite index)"""
        from datetime import datetime
        result = self.db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.expires_at < datetime.utcnow()
        ).delete()
        self.db.commit()
        logger.info(f"Cleaned up {result} expired reset tokens")
        return result


class SessionRepository:
    """Repository for UserSession model operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_token_id(self, token_id: str) -> Optional[models.UserSession]:
        """Get session by token ID (JWT jti)"""
        return self.db.query(models.UserSession).filter(
            models.UserSession.token_id == token_id,
            models.UserSession.is_active == True
        ).first()
    
    def get_by_user_id(self, user_id: str, include_inactive: bool = False) -> List[models.UserSession]:
        """Get all sessions for a user"""
        query = self.db.query(models.UserSession).filter(
            models.UserSession.user_id == user_id
        )
        if not include_inactive:
            query = query.filter(models.UserSession.is_active == True)
        return query.order_by(models.UserSession.last_used_at.desc()).all()
    
    def get_active_sessions(self, user_id: str) -> List[models.UserSession]:
        """Get all active sessions for a user"""
        return self.db.query(models.UserSession).filter(
            models.UserSession.user_id == user_id,
            models.UserSession.is_active == True
        ).order_by(models.UserSession.last_used_at.desc()).all()
    
    def create(self, session: models.UserSession) -> models.UserSession:
        """Create new session"""
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        logger.info(f"Created session for user: {session.user_id}, device: {session.device_name}")
        return session
    
    def update_last_used(self, session: models.UserSession) -> models.UserSession:
        """Update session last used timestamp"""
        from datetime import datetime
        session.last_used_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(session)
        return session
    
    def revoke_session(self, session_id: str, user_id: str) -> bool:
        """Revoke a specific session (soft delete)"""
        session = self.db.query(models.UserSession).filter(
            models.UserSession.id == session_id,
            models.UserSession.user_id == user_id
        ).first()
        if session:
            session.is_active = False
            self.db.commit()
            logger.info(f"Revoked session {session_id} for user {user_id}")
            return True
        return False
    
    def revoke_all_sessions(self, user_id: str, exclude_token_id: Optional[str] = None) -> int:
        """Revoke all sessions for a user, optionally excluding one"""
        query = self.db.query(models.UserSession).filter(
            models.UserSession.user_id == user_id,
            models.UserSession.is_active == True
        )
        if exclude_token_id:
            query = query.filter(models.UserSession.token_id != exclude_token_id)
        
        count = query.update({"is_active": False})
        self.db.commit()
        logger.info(f"Revoked {count} sessions for user {user_id}")
        return count
    
    def cleanup_expired(self) -> int:
        """Delete expired sessions"""
        from datetime import datetime
        result = self.db.query(models.UserSession).filter(
            models.UserSession.expires_at < datetime.utcnow()
        ).delete()
        self.db.commit()
        logger.info(f"Cleaned up {result} expired sessions")
        return result


class LoginHistoryRepository:
    """Repository for LoginHistory model operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, history_entry: models.LoginHistory) -> models.LoginHistory:
        """Create new login history entry"""
        self.db.add(history_entry)
        self.db.commit()
        self.db.refresh(history_entry)
        logger.info(f"Created login history entry: {history_entry.email}, success={history_entry.success}")
        return history_entry
    
    def get_by_user_id(self, user_id: str, limit: int = 50) -> List[models.LoginHistory]:
        """Get login history for a user (most recent first)"""
        return self.db.query(models.LoginHistory).filter(
            models.LoginHistory.user_id == user_id
        ).order_by(
            models.LoginHistory.created_at.desc()
        ).limit(limit).all()
    
    def get_by_email(self, email: str, limit: int = 50) -> List[models.LoginHistory]:
        """Get login history by email (for failed attempts)"""
        return self.db.query(models.LoginHistory).filter(
            models.LoginHistory.email == email
        ).order_by(
            models.LoginHistory.created_at.desc()
        ).limit(limit).all()
    
    def get_recent_failures(self, email: str, minutes: int = 15) -> List[models.LoginHistory]:
        """Get recent failed login attempts for an email"""
        from datetime import datetime, timedelta
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
        return self.db.query(models.LoginHistory).filter(
            models.LoginHistory.email == email,
            models.LoginHistory.success == False,
            models.LoginHistory.created_at >= cutoff_time
        ).order_by(
            models.LoginHistory.created_at.desc()
        ).all()


class ChatFeedbackRepository:
    """Repository for chat feedback persistence"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_user_and_session(self, user_id: str, session_id: str) -> Optional[ChatFeedback]:
        return (
            self.db.query(ChatFeedback)
            .filter(ChatFeedback.user_id == user_id, ChatFeedback.session_id == session_id)
            .first()
        )

    def list_for_user(self, user_id: str, limit: int = 50) -> List[ChatFeedback]:
        return (
            self.db.query(ChatFeedback)
            .filter(ChatFeedback.user_id == user_id)
            .order_by(ChatFeedback.created_at.desc())
            .limit(limit)
            .all()
        )

    def upsert(
        self,
        *,
        user_id: str,
        session_id: str,
        rating: int,
        comment: Optional[str] = None,
        session_title: Optional[str] = None,
    ) -> ChatFeedback:
        existing = self.get_by_user_and_session(user_id, session_id)
        if existing:
            existing.rating = rating
            existing.comment = comment
            existing.session_title = session_title or existing.session_title
            self.db.commit()
            self.db.refresh(existing)
            return existing

        feedback = ChatFeedback(
            user_id=user_id,
            session_id=session_id,
            rating=rating,
            comment=comment,
            session_title=session_title,
        )
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

class AppointmentRepository:
    """Repository for Appointment model operations with validation and optimized queries."""

    def __init__(self, db: Session):
        self.db = db
        self.model = Appointment

    def get_by_id(self, appointment_id: int) -> Optional[models.Appointment]:
        """Get a single appointment by its ID, with related customer and technician info."""
        return (
            self.db.query(self.model)
            .filter(self.model.id == appointment_id)
            .options(joinedload(self.model.customer), joinedload(self.model.technician))
            .first()
        )

    def get_by_customer_id(self, customer_id: str, skip: int = 0, limit: int = 100) -> List[models.Appointment]:
        """Get paginated appointments for a specific customer."""
        return (
            self.db.query(self.model)
            .filter(self.model.customer_id == customer_id)
            .options(joinedload(self.model.technician))
            .order_by(self.model.scheduled_for.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_technician_id(self, technician_id: str, skip: int = 0, limit: int = 100) -> List[models.Appointment]:
        """Get paginated appointments for a specific technician."""
        return (
            self.db.query(self.model)
            .filter(self.model.technician_id == technician_id)
            .options(joinedload(self.model.customer))
            .order_by(self.model.scheduled_for.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def search(
        self,
        *,
        customer_id: Optional[str] = None,
        technician_id: Optional[str] = None,
        status: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[models.Appointment], int]:
        """Search and filter appointments with pagination. Returns a tuple of (items, total_count)."""
        query = self.db.query(self.model)
        if customer_id is not None:
            query = query.filter(self.model.customer_id == customer_id)
        if technician_id is not None:
            query = query.filter(self.model.technician_id == technician_id)
        if status is not None:
            query = query.filter(self.model.status == status)
        if date_from is not None:
            query = query.filter(self.model.scheduled_for >= date_from)
        if date_to is not None:
            query = query.filter(self.model.scheduled_for <= date_to)

        query = query.options(joinedload(self.model.customer), joinedload(self.model.technician))
        total_count = query.count()
        items = query.order_by(self.model.scheduled_for.desc()).offset(skip).limit(limit).all()
        return items, total_count

    def create(
        self,
        *,
        customer_id: str,
        technician_id: str,
        scheduled_for: datetime,
        notes: Optional[str] = None,
        status: str = "SCHEDULED",
    ) -> models.Appointment:
        """
        Create a new appointment after validating customer and technician.
        Raises ValueError if customer or technician are invalid.
        """
        user_repo = UserRepository(self.db)
        customer = user_repo.get_by_id(customer_id)
        if not customer or not customer.is_active:
            raise ValueError(f"Invalid or inactive customer ID: {customer_id}")

        technician = user_repo.get_by_id(technician_id)
        if not technician or not technician.is_active:
            raise ValueError(f"Invalid or inactive technician ID: {technician_id}")
        if getattr(technician, "role", "user") != "technician":
            raise ValueError(f"User {technician_id} is not a technician.")

        appointment = self.model(
            customer_id=customer_id,
            technician_id=technician_id,
            scheduled_for=scheduled_for,
            notes=notes,
            status=status,
        )
        self.db.add(appointment)
        self.db.commit()
        self.db.refresh(appointment)
        logger.info(f"Created appointment {appointment.id} for customer {customer_id}")
        return appointment

    def update_by_id(self, appointment_id: int, update_data: dict) -> Optional[models.Appointment]:
        """
        Update an existing appointment by ID, with validation for user fields.
        Raises ValueError if customer or technician IDs in update_data are invalid.
        """
        db_appointment = self.get_by_id(appointment_id)
        if not db_appointment:
            return None

        if "customer_id" in update_data:
            user_repo = UserRepository(self.db)
            customer = user_repo.get_by_id(update_data["customer_id"])
            if not customer or not customer.is_active:
                raise ValueError(f"Invalid or inactive customer ID: {update_data['customer_id']}")

        if "technician_id" in update_data:
            user_repo = UserRepository(self.db)
            technician = user_repo.get_by_id(update_data["technician_id"])
            if not technician or not technician.is_active:
                raise ValueError(f"Invalid or inactive technician ID: {update_data['technician_id']}")
            if getattr(technician, "role", "user") != "technician":
                raise ValueError(f"User {update_data['technician_id']} is not a technician.")

        for key, value in update_data.items():
            if hasattr(db_appointment, key):
                setattr(db_appointment, key, value)

        self.db.commit()
        self.db.refresh(db_appointment)
        logger.info(f"Updated appointment {db_appointment.id}")
        return db_appointment

    def update_by_customer_id(self, customer_id: str, update_data: dict) -> int:
        """Bulk update appointments for a customer. Returns the number of updated rows."""
        safe_update_data = {k: v for k, v in update_data.items() if k not in ["id", "customer_id"]}
        if not safe_update_data:
            return 0
        updated_count = self.db.query(self.model).filter(self.model.customer_id == customer_id).update(safe_update_data, synchronize_session=False)
        self.db.commit()
        logger.info(f"Updated {updated_count} appointments for customer {customer_id}")
        return updated_count

    def update_by_technician_id(self, technician_id: str, update_data: dict) -> int:
        """Bulk update appointments for a technician. Returns the number of updated rows."""
        safe_update_data = {k: v for k, v in update_data.items() if k not in ["id", "customer_id", "technician_id"]}
        if not safe_update_data:
            return 0
        updated_count = self.db.query(self.model).filter(self.model.technician_id == technician_id).update(safe_update_data, synchronize_session=False)
        self.db.commit()
        logger.info(f"Updated {updated_count} appointments for technician {technician_id}")
        return updated_count

    def delete_by_id(self, appointment_id: int) -> bool:
        """Delete an appointment by its ID. Returns True if deleted, False otherwise."""
        db_appointment = self.db.query(self.model).filter(self.model.id == appointment_id).first()
        if db_appointment:
            self.db.delete(db_appointment)
            self.db.commit()
            logger.warning(f"Deleted appointment: {appointment_id}")
            return True
        return False

    def delete_by_customer_id(self, customer_id: str) -> int:
        """Bulk delete appointments for a customer. Returns the number of deleted rows."""
        deleted_count = self.db.query(self.model).filter(self.model.customer_id == customer_id).delete(synchronize_session=False)
        self.db.commit()
        logger.warning(f"Deleted {deleted_count} appointments for customer {customer_id}")
        return deleted_count

    def delete_by_technician_id(self, technician_id: str) -> int:
        """Bulk delete appointments for a technician. Returns the number of deleted rows."""
        deleted_count = self.db.query(self.model).filter(self.model.technician_id == technician_id).delete(synchronize_session=False)
        self.db.commit()
        logger.warning(f"Deleted {deleted_count} appointments for technician {technician_id}")
        return deleted_count