"""
Database models optimized for scalability with proper indexing
Includes field-level encryption for sensitive data
"""
from sqlalchemy import Column, String, Integer, Boolean, JSON, DateTime, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import TypeDecorator, CHAR
import uuid
from app.database.connection import Base
from app.core.encryption import encrypt_field, decrypt_field


# SQLite-compatible UUID type
class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses CHAR(36) on SQLite, UUID on PostgreSQL
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value


class User(Base):
    """
    User model with optimized indexes for common queries.
    Sensitive fields (address, phone) are encrypted at rest.
    
    Indexes:
    - email: For login lookups (unique)
    - username: For profile lookups (unique)
    - google_id: For OAuth lookups (unique, sparse)
    - (is_active, created_at): For active user listings
    - (role, is_active): For role-based queries
    """
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users - bcrypt hashed
    full_name = Column(String(255), nullable=True)
    _address = Column("address", Text, nullable=True)  # Encrypted field
    _phone = Column("phone", String(500), nullable=True)  # Encrypted field (longer for encrypted data)
    preferred_contact_method = Column(String(20), nullable=True)
    skill_level = Column(Integer, default=1)
    role = Column(String(20), default="user", index=True)  # user, guest, admin
    gdpr_consent = Column(Boolean, default=False)
    referral_source = Column(String(100), nullable=True)
    age_verified = Column(Boolean, default=False)
    
    # Enterprise fields
    enterprise_id = Column(GUID(), ForeignKey("enterprises.id", ondelete="SET NULL"), nullable=True, index=True)
    branch_id = Column(GUID(), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True)
    enterprise_role = Column(String(50), nullable=True, index=True)  # technician, senior_technician, branch_manager, enterprise_admin
    employee_id = Column(String(100), nullable=True)  # Internal employee ID
    
    # Use JSON type (SQLAlchemy automatically uses JSONB on PostgreSQL)
    available_tools = Column(JSON, default=list)
    owned_products = Column(JSON, default=list)
    
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Account lockout protection
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # OAuth fields
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    
    # Relationships
    enterprise = relationship("Enterprise", back_populates="employees", foreign_keys=[enterprise_id])
    branch = relationship("Branch", back_populates="employees", foreign_keys=[branch_id])
    
    # Composite indexes for common query patterns
    __table_args__ = (
        Index('ix_users_active_created', 'is_active', 'created_at'),
        Index('ix_users_role_active', 'role', 'is_active'),
        Index('ix_users_enterprise_branch', 'enterprise_id', 'branch_id'),
        Index('ix_users_enterprise_role', 'enterprise_id', 'enterprise_role'),
    )
    
    # Encrypted field properties
    @property
    def address(self):
        """Decrypt address when reading"""
        if self._address:
            return decrypt_field(self._address)
        return None
    
    @address.setter
    def address(self, value):
        """Encrypt address when writing"""
        if value:
            self._address = encrypt_field(value)
        else:
            self._address = None
    
    @property
    def phone(self):
        """Decrypt phone when reading"""
        if self._phone:
            return decrypt_field(self._phone)
        return None
    
    @phone.setter
    def phone(self, value):
        """Encrypt phone when writing"""
        if value:
            self._phone = encrypt_field(value)
        else:
            self._phone = None

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class Product(Base):
    """
    Product model with barcode indexing.
    
    Indexes:
    - barcode: For guest login lookups (unique)
    - created_at: For temporal queries
    """
    __tablename__ = "products"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    barcode = Column(String(100), unique=True, index=True, nullable=False)
    brand = Column(String(100), nullable=True, index=True)
    model = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    __table_args__ = (
        Index('ix_products_brand_model', 'brand', 'model'),
    )

    def __repr__(self):
        return f"<Product(barcode={self.barcode}, brand={self.brand})>"


class PasswordResetToken(Base):
    """
    Password reset token model.
    
    Indexes:
    - token: For token validation lookups (unique)
    - user_id: For user token lookups
    - (expires_at, used): For cleanup queries
    """
    __tablename__ = "password_reset_tokens"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship("User", backref="reset_tokens")
    
    __table_args__ = (
        Index('ix_password_reset_expires_used', 'expires_at', 'used'),
    )

    def __repr__(self):
        return f"<PasswordResetToken(user_id={self.user_id}, used={self.used})>"


class UserSession(Base):
    """
    User session model for tracking active devices and sessions.
    
    Tracks:
    - JWT token ID (jti claim)
    - Device information (user agent, IP)
    - Session metadata (created, last used)
    - Active status
    
    Indexes:
    - user_id: For user session lookups
    - token_id: For token validation (unique)
    - (user_id, is_active): For active session queries
    """
    __tablename__ = "user_sessions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_id = Column(String(255), unique=True, index=True, nullable=False)  # JWT jti claim
    device_name = Column(String(255), nullable=True)  # e.g., "Chrome on Windows"
    user_agent = Column(Text, nullable=True)  # Full user agent string
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    last_used_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Relationship
    user = relationship("User", backref="sessions")
    
    __table_args__ = (
        Index('ix_user_sessions_user_active', 'user_id', 'is_active'),
        Index('ix_user_sessions_expires', 'expires_at', 'is_active'),
    )

    def __repr__(self):
        return f"<UserSession(user_id={self.user_id}, device={self.device_name}, active={self.is_active})>"


class LoginHistory(Base):
    """
    Login history model for audit logging and security monitoring.
    
    Tracks all login attempts (successful and failed) with:
    - User information
    - IP address and user agent
    - Timestamp
    - Success/failure status
    - Device information
    
    Indexes:
    - user_id: For user login history queries
    - (user_id, created_at): For chronological user history
    - ip_address: For suspicious activity detection
    - success: For failure analysis
    """
    __tablename__ = "login_history"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)  # Nullable for failed attempts with non-existent users
    email = Column(String(255), nullable=True, index=True)  # Store email for failed attempts
    success = Column(Boolean, default=False, index=True)
    ip_address = Column(String(45), nullable=True, index=True)  # IPv4 or IPv6
    user_agent = Column(Text, nullable=True)
    device_name = Column(String(255), nullable=True)
    failure_reason = Column(String(255), nullable=True)  # e.g., "Invalid password", "Account locked"
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationship
    user = relationship("User", backref="login_history")
    
    __table_args__ = (
        Index('ix_login_history_user_created', 'user_id', 'created_at'),
        Index('ix_login_history_email_created', 'email', 'created_at'),
    )

    def __repr__(self):
        return f"<LoginHistory(user_id={self.user_id}, email={self.email}, success={self.success}, created_at={self.created_at})>"

