"""
Vacation/Off-day database model for tracking employee time off.
"""
import uuid
import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.connection import Base
from app.models.user import GUID


class VacationType(str, enum.Enum):
    """Types of vacation/time off"""
    ANNUAL = "annual"  # Yıllık izin
    SICK = "sick"  # Hastalık izni
    PERSONAL = "personal"  # Kişisel izin
    UNPAID = "unpaid"  # Ücretsiz izin
    MATERNITY = "maternity"  # Doğum izni
    PATERNITY = "paternity"  # Babalık izni
    MARRIAGE = "marriage"  # Evlilik izni
    BEREAVEMENT = "bereavement"  # Vefat izni
    OTHER = "other"  # Diğer


class VacationStatus(str, enum.Enum):
    """Status of vacation request"""
    PENDING = "pending"  # Beklemede
    APPROVED = "approved"  # Onaylandı
    REJECTED = "rejected"  # Reddedildi
    CANCELLED = "cancelled"  # İptal edildi


class Vacation(Base):
    """
    Vacation/off-day model for tracking employee time off.
    
    Indexes:
    - employee_id: For employee vacation lookups
    - branch_id: For branch vacation queries
    - (start_date, end_date): For date range queries
    - status: For filtering by status
    """
    __tablename__ = "vacations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    employee_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(GUID(), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Vacation details
    vacation_type = Column(Enum(VacationType), nullable=False, default=VacationType.ANNUAL)
    status = Column(Enum(VacationStatus), nullable=False, default=VacationStatus.APPROVED, index=True)
    
    # Date range
    start_date = Column(DateTime(timezone=True), nullable=False, index=True)
    end_date = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Additional info
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)  # Manager notes
    
    # Approval tracking
    approved_by = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employee = relationship("User", foreign_keys=[employee_id], backref="vacations")
    branch = relationship("Branch", backref="vacations")
    approver = relationship("User", foreign_keys=[approved_by])
    
    __table_args__ = (
        Index('ix_vacations_employee_dates', 'employee_id', 'start_date', 'end_date'),
        Index('ix_vacations_branch_dates', 'branch_id', 'start_date', 'end_date'),
        Index('ix_vacations_date_range', 'start_date', 'end_date'),
    )

    def __repr__(self):
        return f"<Vacation(id={self.id}, employee_id={self.employee_id}, start={self.start_date}, end={self.end_date})>"

