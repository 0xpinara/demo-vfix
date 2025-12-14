"""
Business logic for enterprise and branch management
"""
from sqlalchemy.orm import Session
from typing import Optional, Tuple
from fastapi import Request

from app import models, schemas
from app.services.enterprise_repository import EnterpriseRepository, BranchRepository
from app.services.repositories import UserRepository
from app.core.security import get_password_hash, create_access_token


class EnterpriseService:
    """Service for enterprise business logic"""
    
    def __init__(self, db: Session):
        self.db = db
        self.enterprise_repo = EnterpriseRepository(db)
        self.branch_repo = BranchRepository(db)
        self.user_repo = UserRepository(db)
    
    def register_enterprise_user(
        self, 
        user_data: schemas.EnterpriseRegister,
        request: Optional[Request] = None
    ) -> Tuple[models.User, models.Enterprise, models.Branch, str, str]:
        """
        Register a new enterprise user with enterprise and branch.
        
        Creates:
        1. Enterprise (if new) or gets existing
        2. Branch (new)
        3. User account with enterprise fields
        
        Returns: (user, enterprise, branch, access_token, refresh_token)
        """
        # Check if user already exists
        if self.user_repo.exists_by_email_or_username(user_data.email, user_data.username):
            raise ValueError("Bu e-posta veya kullanıcı adı zaten kullanılıyor")
        
        # Check GDPR consent
        if not user_data.gdpr_consent:
            raise ValueError("GDPR onayı gereklidir")
        
        # Create or get enterprise
        enterprise = self.enterprise_repo.get_by_name(user_data.enterprise_name)
        if not enterprise:
            # Create new enterprise
            # Convert empty string to None for registration_number to avoid UNIQUE constraint issues
            reg_number = user_data.enterprise_registration_number if user_data.enterprise_registration_number and user_data.enterprise_registration_number.strip() else None
            enterprise = self.enterprise_repo.create(
                name=user_data.enterprise_name,
                registration_number=reg_number,
                contact_email=user_data.enterprise_contact_email,
                contact_phone=user_data.enterprise_contact_phone,
                is_active=True
            )
        
        # Create branch
        branch = self.branch_repo.create(
            enterprise_id=enterprise.id,
            name=user_data.branch_name,
            address=user_data.branch_address,
            phone=user_data.branch_phone,
            is_active=True
        )
        
        # Create user
        hashed_password = get_password_hash(user_data.password)
        
        user = models.User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            phone=user_data.phone,
            role="user",  # Base role remains "user"
            enterprise_id=enterprise.id,
            branch_id=branch.id,
            enterprise_role=user_data.enterprise_role,
            employee_id=user_data.employee_id,
            gdpr_consent=user_data.gdpr_consent,
            age_verified=user_data.age_verified,
            is_active=True
        )
        
        # If role is branch_manager, set them as branch manager
        if user_data.enterprise_role == "branch_manager":
            # Save user first to get ID
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            
            # Update branch manager
            branch.manager_id = user.id
            self.db.commit()
            self.db.refresh(branch)
        else:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        
        # Generate JWT token
        access_token, jti = create_access_token(data={"sub": str(user.id)})
        
        # Create session (from existing auth service pattern)
        from app.core.security import get_device_info
        from datetime import datetime, timedelta
        
        if request:
            device_name, user_agent, ip_address = get_device_info(request)
        else:
            device_name, user_agent, ip_address = None, None, None
        
        session = models.UserSession(
            user_id=user.id,
            token_id=jti,
            device_name=device_name or "Unknown",
            user_agent=user_agent,
            ip_address=ip_address,
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        self.db.add(session)
        self.db.commit()
        
        return user, enterprise, branch, access_token, jti

