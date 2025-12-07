import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class AppointmentStatus(str, enum.Enum):
    """
    Keeps possible statuses for appointments.
    """
    PENDING = "pending"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Appointment(Base):
    """
    Stores information about appointments. Including:
    id, customer_id, technician_id, product_brand, product_model, product_issue,
    location, scheduled_for, status, created_at, updated_at.
    """
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    product_brand = Column(String, nullable=False)
    product_model = Column(String, nullable=False)
    product_issue = Column(String, nullable=False)
    
    location = Column(String, nullable=False)
    scheduled_for = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(AppointmentStatus), nullable=False, default=AppointmentStatus.PENDING)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Note: You will need to add the corresponding `back_populates` to your User model
    customer = relationship("User", foreign_keys=[customer_id])
    technician = relationship("User", foreign_keys=[technician_id])