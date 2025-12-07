from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from ..models.appointment import AppointmentStatus

# --- Nested Schemas for rich responses ---

class ProductInfo(BaseModel):
    """Product details related to an appointment."""
    brand: str
    model: str
    issue: str

    model_config = {"from_attributes": True}

class UserInfo(BaseModel):
    """Basic user information for embedding in other responses."""
    id: int
    name: str

    model_config = {"from_attributes": True}

# --- Schemas for API Requests (Input) ---

class AppointmentCreate(BaseModel):
    """Schema for creating a new appointment. Sent by the customer."""
    product_brand: str = Field(..., description="Brand of the product needing service.")
    product_model: str = Field(..., description="Model of the product.")
    product_issue: str = Field(..., description="Detailed description of the issue.")
    location: str = Field(..., description="Customer's address for the service.")
    scheduled_for: datetime = Field(..., description="Proposed date and time for the appointment.")

class AppointmentUpdate(BaseModel):
    """
    Schema for updating an appointment.
    All fields are optional for partial updates (PATCH).
    """
    technician_id: Optional[int] = Field(None, description="ID of the technician assigned to the job.")
    scheduled_for: Optional[datetime] = Field(None, description="New date and time for rescheduling.")
    status: Optional[AppointmentStatus] = Field(None, description="Updated status of the appointment (e.g., 'completed', 'cancelled').")
    location: Optional[str] = Field(None, description="Updated location for the service.")


class AppointmentStatusUpdate(BaseModel):
    """Schema for updating the status of an appointment. Sent by the technician."""
    status: AppointmentStatus = Field(..., description="The new status of the appointment.")


class AppointmentReschedule(BaseModel):
    """Schema for when a customer reschedules an appointment."""
    scheduled_for: datetime = Field(..., description="The new desired date and time for the appointment.")


class AppointmentAssign(BaseModel):
    """Schema for assigning a technician and scheduling an appointment."""
    technician_id: int = Field(..., description="ID of the technician to assign.")
    scheduled_for: datetime = Field(..., description="The scheduled date and time for the appointment.")


# --- Schemas for API Responses (Output) ---

class AppointmentResponse(BaseModel):
    """
    Detailed response schema for a single appointment.
    This is the main representation of an appointment returned by the API.
    """
    id: int
    scheduled_for: datetime
    status: AppointmentStatus
    product: ProductInfo
    location: Optional[str] = None
    customer: Optional[UserInfo] = None
    technician: Optional[UserInfo] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class AppointmentListResponse(BaseModel):
    """Response schema for a list of appointments, including pagination details."""
    items: List[AppointmentResponse]
    total: int = Field(..., description="Total number of appointments matching the query.")

    model_config = {"from_attributes": True}