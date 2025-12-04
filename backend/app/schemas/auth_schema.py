from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID


class OwnedProduct(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None

    model_config = {"from_attributes": True}


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    preferred_contact_method: Optional[str] = None
    skill_level: int = Field(default=1, ge=1, le=5)
    available_tools: List[str] = Field(default_factory=list)
    owned_products: List[OwnedProduct] = Field(default_factory=list)


class UserRegister(UserBase):
    password: str = Field(..., min_length=8)
    gdpr_consent: bool
    referral_source: Optional[str] = None
    age_verified: bool

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isalpha() for char in v):
            raise ValueError('Password must contain at least one letter')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleLogin(BaseModel):
    token: str


class GuestLogin(BaseModel):
    barcode: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class UserResponse(BaseModel):
    id: UUID
    email: str
    username: str
    full_name: Optional[str]
    role: str
    address: Optional[str] = None
    phone: Optional[str] = None
    preferred_contact_method: Optional[str] = None
    skill_level: int
    available_tools: List[str]
    owned_products: List[OwnedProduct]

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Optional[str] = None


class RegisterResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"


class ErrorResponse(BaseModel):
    detail: str
    errors: Optional[List[Dict[str, str]]] = None


class SessionResponse(BaseModel):
    """Session information response"""
    id: UUID
    device_name: Optional[str]
    user_agent: Optional[str]
    ip_address: Optional[str]
    is_active: bool
    created_at: datetime
    last_used_at: datetime
    expires_at: datetime
    is_current: bool = False  # True if this is the current session

    model_config = {"from_attributes": True}


class SessionsListResponse(BaseModel):
    """List of user sessions"""
    sessions: List[SessionResponse]
    total: int
    active_count: int


class RevokeSessionRequest(BaseModel):
    """Request to revoke a session"""
    session_id: UUID


class LoginHistoryResponse(BaseModel):
    """Login history entry response"""
    id: UUID
    email: Optional[str]
    success: bool
    ip_address: Optional[str]
    user_agent: Optional[str]
    device_name: Optional[str]
    failure_reason: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginHistoryListResponse(BaseModel):
    """List of login history entries"""
    history: List[LoginHistoryResponse]
    total: int
    successful_count: int
    failed_count: int

