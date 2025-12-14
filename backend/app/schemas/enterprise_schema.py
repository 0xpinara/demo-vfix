"""
Pydantic schemas for enterprise and branch endpoints
"""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ============================================================================
# ENTERPRISE REGISTRATION
# ============================================================================

class EnterpriseRegister(BaseModel):
    # Account info
    email: EmailStr
    username: str
    password: str
    full_name: str
    phone: Optional[str] = None
    
    # Enterprise info
    enterprise_name: str
    enterprise_registration_number: Optional[str] = None
    enterprise_contact_email: EmailStr
    enterprise_contact_phone: Optional[str] = None
    
    # Branch info
    branch_name: str
    branch_address: Optional[str] = None
    branch_phone: Optional[str] = None
    
    # Employee info
    employee_id: Optional[str] = None
    enterprise_role: str  # technician, senior_technician, branch_manager, enterprise_admin
    specialization: Optional[List[str]] = []  # For technicians
    
    # Compliance
    gdpr_consent: bool
    age_verified: bool
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
            raise ValueError("Password must contain letters and numbers")
        return v
    
    @field_validator('enterprise_role')
    @classmethod
    def validate_enterprise_role(cls, v):
        valid_roles = ['technician', 'senior_technician', 'branch_manager', 'enterprise_admin']
        if v not in valid_roles:
            raise ValueError(f"Invalid enterprise role. Must be one of: {', '.join(valid_roles)}")
        return v
    
    @field_validator('gdpr_consent')
    @classmethod
    def validate_gdpr(cls, v):
        if not v:
            raise ValueError("GDPR consent is required")
        return v


# ============================================================================
# ENTERPRISE RESPONSES
# ============================================================================

class EnterpriseResponse(BaseModel):
    model_config = {"from_attributes": True}
    
    id: UUID
    name: str
    registration_number: Optional[str] = None
    contact_email: str
    contact_phone: Optional[str] = None
    is_active: bool
    created_at: datetime


class BranchResponse(BaseModel):
    model_config = {"from_attributes": True}
    
    id: UUID
    enterprise_id: UUID
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    manager_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime


class EnterpriseUserResponse(BaseModel):
    model_config = {"from_attributes": True}
    
    id: UUID
    email: str
    username: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    enterprise_id: Optional[UUID] = None
    branch_id: Optional[UUID] = None
    enterprise_role: Optional[str] = None
    employee_id: Optional[str] = None
    is_active: bool
    created_at: datetime


class EnterpriseRegistrationResponse(BaseModel):
    user: EnterpriseUserResponse
    enterprise: EnterpriseResponse
    branch: BranchResponse
    access_token: str
    token_type: str = "bearer"



