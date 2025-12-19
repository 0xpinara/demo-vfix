from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app import schemas, models
from app.core.dependencies import get_current_user
from app.database import get_db
from app.services.appointment_service import AppointmentService

router = APIRouter()


def get_appointment_service(db: Session = Depends(get_db)) -> AppointmentService:
    return AppointmentService(db)


@router.post("/", response_model=schemas.AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment_in: schemas.AppointmentCreate,
    current_user: models.User = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
):
    """
    Create a new appointment.
    - If created by a user/admin, it's for themselves.
    - If created by a technician, it's for a specified customer and assigned to the technician.
    """
    # Allow users, admins, and technicians to create appointments
    allowed_roles = ["user", "admin", "technician", "senior_technician", "branch_manager", "enterprise_admin"]
    user_role = getattr(current_user, 'enterprise_role', getattr(current_user, 'role', ''))
    if not user_role:
        user_role = getattr(current_user, 'role', '')

    if user_role not in allowed_roles and current_user.role not in allowed_roles:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to create appointments.")

    other_id = None
    if user_role in  ["user", "admin", "branch_manager", "enterprise_admin"]:
        # Users and Admins create appointments for themselves
        if appointment_in.technician_id:
            other_id = appointment_in.technician_id
    elif user_role in ['senior_technician', "technician"]:
        # Technicians must specify which customer they are creating the appointment for
        if not appointment_in.customer_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Technicians must provide a customer_id when creating an appointment.")
        other_id = appointment_in.customer_id

    if not other_id:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not determine customer/technician for the appointment.")

    try:
        # Pass the full current_user object as the creator
        appointment = service.create_appointment_request(
            appointment_data=appointment_in,
            other_id=other_id,
            creator=current_user
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # The service now returns a complete appointment object, so we can return it directly.
    return appointment


@router.get("/", response_model=List[schemas.AppointmentResponse])
def search_appointments(
    response: Response,
    customer_id: Optional[str] = None,
    technician_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    skip: int = 0,
    limit: int = Query(default=100, lte=200),
    current_user: models.User = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
):
    """
    Search for appointments.
    - Admins can search by any criteria.
    - Technicians can only see their own appointments.
    - Customers can only see their own appointments.
    """
    if not hasattr(current_user, 'role') or current_user.role == "guest":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to search appointments.")

    search_params = {
        "customer_id": customer_id,
        "technician_id": technician_id,
        "status": status,
        "date_from": date_from,
        "date_to": date_to,
    }

    if current_user.role == "user":
        if technician_id or (customer_id and customer_id != current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Users can only view their own appointments.")
        search_params["customer_id"] = current_user.id

    if current_user.role == "technician":
        if customer_id or (technician_id and technician_id != current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Technicians can only view their own appointments.")
        search_params["technician_id"] = current_user.id

    clean_params = {k: v for k, v in search_params.items() if v is not None}

    appointments, total_count = service.search_appointments(search_params=clean_params, skip=skip, limit=limit)

    response.headers["X-Total-Count"] = str(total_count)
    return appointments


@router.get("/", response_model=List[schemas.AppointmentResponse])
def get_appointments(
    current_user: models.User = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all appointments for the currently logged-in user or technician.
    """
    if not hasattr(current_user, 'role') or current_user.role not in ["user", "technician", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this resource")

    if current_user.role == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins should use the search endpoint: GET /api/appointments/")
    elif current_user.role == "user":
        return service.get_appointments_for_customer(customer_id=current_user.id, skip=skip, limit=limit)
    elif current_user.role == "technician":
        return service.get_appointments_for_technician(technician_id=current_user.id, skip=skip, limit=limit)


@router.get("/{appointment_id}", response_model=schemas.AppointmentResponse)
def get_appointment(
    appointment_id: int,
    current_user: models.User = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
):
    """
    Get a single appointment by its ID.
    - Admins can get any appointment.
    - Customers can only get their own appointments.
    - Technicians can only get appointments assigned to them.
    """
    appointment = service.get_appointment_by_id(appointment_id)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if (hasattr(current_user, 'role') and current_user.role != "admin" and
            appointment.customer_id != current_user.id and
            appointment.technician_id != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to view this appointment.")

    return appointment


@router.patch("/{appointment_id}", response_model=schemas.AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appointment_in: schemas.AppointmentUpdate,
    current_user: models.User = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
):
    """
    Update an appointment. (Admin Only)
    """
    if not hasattr(current_user, 'role') or current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can update appointments.")

    try:
        updated_appointment = service.update_appointment(appointment_id, appointment_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not updated_appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    return updated_appointment


@router.post("/{appointment_id}/assign", response_model=schemas.AppointmentResponse)
def assign_appointment(
    appointment_id: int,
    assignment_data: schemas.AppointmentAssign,
    current_user: models.User = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
):
    """
    Assign a technician to an appointment and schedule it. (Admin only)
    """
    if not hasattr(current_user, 'role') or current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can assign appointments.")

    try:
        appointment = service.assign_and_schedule_appointment(
            appointment_id=appointment_id,
            technician_id=assignment_data.technician_id,
            scheduled_for=assignment_data.scheduled_for
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    return appointment


@router.patch("/{appointment_id}/status", response_model=schemas.AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    status_in: schemas.AppointmentStatusUpdate,
    current_user: models.User = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
):
    """
    Update the status of an appointment. (Technician only)
    A technician can only update the status of their own assigned appointments.
    """
    print(current_user.enterprise_role)
    if not hasattr(current_user, 'role') or current_user.enterprise_role == "":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only technicians can update appointment status.")

    try:
        updated_appointment = service.update_appointment_status(
            appointment_id=appointment_id, 
            new_status=status_in.status, 
            technician_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    if not updated_appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found or not assigned to you.")

    return updated_appointment


@router.patch("/{appointment_id}/reschedule", response_model=schemas.AppointmentResponse)
def reschedule_appointment(
    appointment_id: int,
    reschedule_in: schemas.AppointmentReschedule,
    current_user: models.User = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
):
    """
    Allows a user to reschedule their own appointment.
    """
    if not hasattr(current_user, 'role') or current_user.role != "user":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only users can reschedule their appointments.")

    try:
        updated_appointment = service.reschedule_appointment(
            appointment_id=appointment_id,
            new_date=reschedule_in.scheduled_for,
            customer_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    if not updated_appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found or you're not authorized to reschedule it.")

    return updated_appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int,
    current_user: models.User = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
):
    """
    Delete an appointment.
    - Admins can delete any appointment.
    - Users can delete their own appointments.
    """
    if not hasattr(current_user, 'role') or current_user.role not in ["admin", "user"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to delete appointments.")

    try:
        deleted = service.delete_appointment(appointment_id=appointment_id, user=current_user)
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found or you are not authorized to delete it.")

    return Response(status_code=status.HTTP_204_NO_CONTENT)