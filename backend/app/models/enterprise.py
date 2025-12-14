"""
Enterprise and Branch database models for organization management
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database.connection import Base
from app.models.user import GUID
from app.core.encryption import encrypt_field, decrypt_field


class Enterprise(Base):
    """
    Enterprise model representing organizations/companies.
    
    Indexes:
    - name: For search queries
    - registration_number: For lookup (unique)
    - is_active: For filtering active enterprises
    """
    __tablename__ = "enterprises"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    registration_number = Column(String(100), unique=True, nullable=True, index=True)  # Tax ID or business registration
    contact_email = Column(String(255), nullable=False)
    _contact_phone = Column("contact_phone", String(500), nullable=True)  # Encrypted
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    branches = relationship("Branch", back_populates="enterprise", cascade="all, delete-orphan")
    employees = relationship("User", back_populates="enterprise", foreign_keys="User.enterprise_id")
    
    __table_args__ = (
        Index('ix_enterprises_name_active', 'name', 'is_active'),
    )
    
    # Encrypted field properties
    @property
    def contact_phone(self):
        """Decrypt contact phone when reading"""
        if self._contact_phone:
            return decrypt_field(self._contact_phone)
        return None
    
    @contact_phone.setter
    def contact_phone(self, value):
        """Encrypt contact phone when writing"""
        if value:
            self._contact_phone = encrypt_field(value)
        else:
            self._contact_phone = None

    def __repr__(self):
        return f"<Enterprise(id={self.id}, name={self.name})>"


class Branch(Base):
    """
    Branch model representing local offices/locations of an enterprise.
    
    Indexes:
    - enterprise_id: For enterprise branch queries
    - manager_id: For manager lookup
    - (enterprise_id, is_active): For active branch queries
    """
    __tablename__ = "branches"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    enterprise_id = Column(GUID(), ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    _address = Column("address", Text, nullable=True)  # Encrypted
    _phone = Column("phone", String(500), nullable=True)  # Encrypted
    manager_id = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    enterprise = relationship("Enterprise", back_populates="branches")
    manager = relationship("User", foreign_keys=[manager_id], backref="managed_branch")
    employees = relationship("User", back_populates="branch", foreign_keys="User.branch_id")
    
    __table_args__ = (
        Index('ix_branches_enterprise_active', 'enterprise_id', 'is_active'),
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
        return f"<Branch(id={self.id}, name={self.name}, enterprise_id={self.enterprise_id})>"

