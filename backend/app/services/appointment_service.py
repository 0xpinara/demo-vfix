from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.services.repositories import UserRepository, AppointmentRepository
from .. import schemas, models
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AppointmentService:
    """Service layer for handling appointment-related business logic."""

    def __init__(self, db: Session):
        self.repo = AppointmentRepository(db)
        self.user_repo = UserRepository(db)

    def get_appointment_by_id(self, appointment_id: int) -> Optional[models.Appointment]:
        """Gets a single appointment by its ID."""
        logger.debug(f"Fetching appointment by id: {appointment_id}")
        return self.repo.get_by_id(appointment_id)

    def get_appointments_for_customer(self, customer_id: str, skip: int = 0, limit: int = 100) -> List[models.Appointment]:
        """Gets a paginated list of appointments for a specific customer."""
        logger.debug(f"Fetching appointments for customer: {customer_id}")
        return self.repo.get_by_customer_id(customer_id, skip=skip, limit=limit)

    def get_appointments_for_technician(self, technician_id: str, skip: int = 0, limit: int = 100) -> List[models.Appointment]:
        """Gets a paginated list of appointments for a specific technician."""
        logger.debug(f"Fetching appointments for technician: {technician_id}")
        return self.repo.get_by_technician_id(technician_id, skip=skip, limit=limit)

    def create_appointment_request(self, appointment_data: schemas.AppointmentCreate, customer_id: str) -> models.Appointment:
        """
        Creates a new appointment request from a customer.
        The appointment is created with a 'PENDING' status and no technician assigned.
        """
        # Validate the customer exists and is active.
        customer = self.user_repo.get_by_id(customer_id)
        if not customer or not customer.is_active:
            raise ValueError(f"Invalid or inactive customer ID: {customer_id}")

        # The repository's `create` method is designed for creating a *scheduled* appointment
        # and requires a technician_id. For a customer-initiated request, it's better
        # to construct the model here and use a more generic repository method.
        # Since the repository doesn't have a simple `add` method, we'll use the session directly.
        appointment = models.Appointment(
            customer_id=customer_id,
            product_brand=appointment_data.product_brand,
            product_model=appointment_data.product_model,
            product_issue=appointment_data.product_issue,
            location=appointment_data.location,
            scheduled_for=appointment_data.scheduled_for,
            status=models.AppointmentStatus.PENDING,
            technician_id=None  # No technician is assigned on initial request.
        )

        self.repo.db.add(appointment)
        self.repo.db.commit()
        self.repo.db.refresh(appointment)
        logger.info(f"Created new appointment request {appointment.id} for customer {customer_id}")
        return appointment

    def update_appointment(self, appointment_id: int, update_data: schemas.AppointmentUpdate) -> Optional[models.Appointment]:
        """
        Updates an appointment. Can be used to change status, reschedule, or assign a technician.
        The repository method handles validation of `technician_id` if it's being changed.
        """
        # Note: The AppointmentUpdate schema should use `str` for technician_id to match the User model.
        update_dict = update_data.model_dump(exclude_unset=True)
        if not update_dict:
            logger.debug(f"Update called for appointment {appointment_id} with no data.")
            return self.repo.get_by_id(appointment_id)

        logger.info(f"Updating appointment {appointment_id} with data: {update_dict}")
        return self.repo.update_by_id(appointment_id, update_dict)

    def assign_and_schedule_appointment(self, appointment_id: int, technician_id: str, scheduled_for: Optional[datetime] = None) -> Optional[models.Appointment]:
        """
        Assigns a technician to a pending appointment and sets its status to 'SCHEDULED'.
        This is a specific business action, likely for an admin or scheduler.
        """
        update_payload: Dict[str, Any] = {
            "technician_id": technician_id,
            "status": models.AppointmentStatus.SCHEDULED
        }
        if scheduled_for:
            update_payload["scheduled_for"] = scheduled_for

        logger.info(f"Assigning technician {technician_id} to appointment {appointment_id}")
        # The repo's update_by_id method includes validation for the technician_id.
        return self.repo.update_by_id(appointment_id, update_payload)

    def update_appointment_status(self, appointment_id: int, new_status: models.AppointmentStatus, technician_id: str) -> Optional[models.Appointment]:
        """
        Allows a technician to update the status of an appointment assigned to them.
        """
        appointment = self.repo.get_by_id(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found.")

        if appointment.technician_id != technician_id:
            raise PermissionError("You are not authorized to update this appointment.")

        update_data = {"status": new_status}
        logger.info(f"Technician {technician_id} updating status of appointment {appointment_id} to {new_status}")
        return self.repo.update_by_id(appointment_id, update_data)

    def reschedule_appointment(self, appointment_id: int, new_date: datetime, customer_id: str) -> Optional[models.Appointment]:
        """
        Allows a customer to reschedule their own appointment.
        """
        appointment = self.repo.get_by_id(appointment_id)
        if not appointment:
            raise ValueError("Appointment not found.")

        if appointment.customer_id != customer_id:
            raise PermissionError("You are not authorized to reschedule this appointment.")

        update_data = {"scheduled_for": new_date}
        logger.info(f"Customer {customer_id} rescheduling appointment {appointment_id} to {new_date}")
        return self.repo.update_by_id(appointment_id, update_data)

    def delete_appointment(self, appointment_id: int, user: models.User) -> bool:
        """
        Deletes an appointment by its ID, with authorization checks.
        - Admins can delete any appointment.
        - Customers can only delete their own appointments.
        """
        appointment = self.repo.get_by_id(appointment_id)
        if not appointment:
            return False  # Not found

        if user.role == "customer" and appointment.customer_id != user.id:
            raise PermissionError("Customers can only delete their own appointments.")
        
        logger.warning(f"User {user.id} ({user.role}) is deleting appointment {appointment_id}")
        return self.repo.delete_by_id(appointment_id)

    def search_appointments(self, search_params: dict, skip: int = 0, limit: int = 100) -> tuple[List[models.Appointment], int]:
        """Searches for appointments based on various criteria."""
        logger.debug(f"Searching appointments with params: {search_params}")
        return self.repo.search(**search_params, skip=skip, limit=limit)