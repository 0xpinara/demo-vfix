"""
Business logic service layer.
Coordinates between repositories, caching, and authentication.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import logging

from app import models
from app import schemas
from app.core.security import get_password_hash, create_access_token, verify_password, get_device_info
from app.services.repositories import UserRepository, ProductRepository, PasswordResetTokenRepository, SessionRepository, LoginHistoryRepository
from app.core.cache import cache
from fastapi import Request

logger = logging.getLogger(__name__)


class AuthService:
    """
    Authentication service with business logic.
    Handles user registration, login, password management.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.product_repo = ProductRepository(db)
        self.token_repo = PasswordResetTokenRepository(db)
        self.session_repo = SessionRepository(db)
        self.history_repo = LoginHistoryRepository(db)
        
        # Account lockout configuration
        self.MAX_FAILED_ATTEMPTS = 5
        self.LOCKOUT_DURATION_MINUTES = 30
    
    def register_user(self, user_data: schemas.UserRegister, request: Optional[Request] = None) -> tuple[models.User, str, str]:
        """
        Register a new user with validation.
        Returns (User, access_token, jti)
        """
        # Check if user already exists
        if self.user_repo.exists_by_email_or_username(user_data.email, user_data.username):
            raise ValueError("Bu e-posta veya kullanıcı adı zaten kullanılıyor")
        
        # Validate GDPR consent
        if not user_data.gdpr_consent:
            raise ValueError("GDPR onayı gereklidir")
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        
        # Prepare owned products data
        owned_products_data = [{"brand": p.brand, "model": p.model} 
                             for p in user_data.owned_products]
        
        # Create user
        db_user = models.User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            address=user_data.address,
            phone=user_data.phone,
            preferred_contact_method=user_data.preferred_contact_method,
            skill_level=user_data.skill_level,
            gdpr_consent=user_data.gdpr_consent,
            referral_source=user_data.referral_source,
            age_verified=user_data.age_verified,
            available_tools=user_data.available_tools,
            owned_products=owned_products_data,
            role="user"
        )
        
        user = self.user_repo.create(db_user)
        
        # Create access token with JWT ID
        access_token, jti = create_access_token(data={"sub": str(user.id)})
        
        # Create session if request is provided
        if request:
            self._create_session(user.id, jti, request)
        
        # Cache user
        self._cache_user(user)
        
        logger.info(f"User registered successfully: {user.email}")
        return user, access_token, jti
    
    def login_user(self, email_or_username: str, password: str, request: Optional[Request] = None) -> tuple[models.User, str, str]:
        """
        Login user with email/username and password.
        Implements account lockout protection and login history tracking.
        Returns (User, access_token, jti)
        """
        # Get device info for logging
        if request:
            device_name, user_agent, ip_address = get_device_info(request)
        else:
            device_name, user_agent, ip_address = None, None, None
        
        # Try to get user by email first, then by username
        user = self.user_repo.get_by_email(email_or_username)
        if not user:
            user = self.user_repo.get_by_username(email_or_username)
        
        if user:
            self._cache_user(user)
        
        # Use the identifier for logging purposes
        email = email_or_username
        
        # Check if account is locked
        if user and user.locked_until:
            from datetime import datetime
            if user.locked_until > datetime.utcnow():
                # Account is still locked
                self._log_login_attempt(
                    email=email,
                    user_id=str(user.id) if user else None,
                    success=False,
                    failure_reason="Account locked",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    device_name=device_name
                )
                raise ValueError("Hesap çok fazla başarısız giriş denemesi nedeniyle geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin.")
            else:
                # Lockout expired, reset
                user.locked_until = None
                user.failed_login_attempts = 0
                self.user_repo.update(user)
        
        # Validate user
        if not user or not user.hashed_password:
            self._log_login_attempt(
                email=email,
                user_id=None,
                success=False,
                failure_reason="User not found",
                ip_address=ip_address,
                user_agent=user_agent,
                device_name=device_name
            )
            raise ValueError("Geçersiz e-posta veya şifre")
        
        # Check if account is inactive
        if not user.is_active:
            self._log_login_attempt(
                email=email,
                user_id=str(user.id),
                success=False,
                failure_reason="Account inactive",
                ip_address=ip_address,
                user_agent=user_agent,
                device_name=device_name
            )
            raise ValueError("Hesap aktif değil")
        
        # Verify password
        if not verify_password(password, user.hashed_password):
            # Increment failed login attempts
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            
            # Lock account if max attempts reached
            if user.failed_login_attempts >= self.MAX_FAILED_ATTEMPTS:
                from datetime import datetime, timedelta
                user.locked_until = datetime.utcnow() + timedelta(minutes=self.LOCKOUT_DURATION_MINUTES)
                logger.warning(f"Account locked for user {user.email} due to {user.failed_login_attempts} failed attempts")
            
            self.user_repo.update(user)
            
            # Log failed attempt
            self._log_login_attempt(
                email=email,
                user_id=str(user.id),
                success=False,
                failure_reason="Invalid password",
                ip_address=ip_address,
                user_agent=user_agent,
                device_name=device_name
            )
            
            raise ValueError("Geçersiz e-posta veya şifre")
        
        # Successful login - reset failed attempts
        if user.failed_login_attempts > 0 or user.locked_until:
            user.failed_login_attempts = 0
            user.locked_until = None
            self.user_repo.update(user)
        
        # Create access token with JWT ID
        access_token, jti = create_access_token(data={"sub": str(user.id)})
        
        # Create session if request is provided
        if request:
            self._create_session(user.id, jti, request)
        
        # Log successful login
        self._log_login_attempt(
            email=email,
            user_id=str(user.id),
            success=True,
            failure_reason=None,
            ip_address=ip_address,
            user_agent=user_agent,
            device_name=device_name
        )
        
        logger.info(f"User logged in successfully: {user.email}")
        return user, access_token, jti
    
    def guest_login(self, barcode: str, request: Optional[Request] = None) -> tuple[models.User, str, str]:
        """
        Create or login guest user with product barcode.
        Returns (User, access_token, jti)
        """
        # Check if product exists
        product = self.product_repo.get_by_barcode(barcode)
        if not product:
            raise ValueError("Geçersiz barkod")
        
        # Get or create guest user
        guest_email = f"guest_{barcode}@vfix.local"
        guest_user = self.user_repo.get_by_email(guest_email)
        
        if not guest_user:
            guest_user = models.User(
                email=guest_email,
                username=f"guest_{barcode}",
                role="guest",
                is_active=True
            )
            guest_user = self.user_repo.create(guest_user)
        
        # Create access token with JWT ID
        access_token, jti = create_access_token(data={"sub": str(guest_user.id)})
        
        # Create session if request is provided
        if request:
            self._create_session(guest_user.id, jti, request)
        
        logger.info(f"Guest logged in with barcode: {barcode}")
        return guest_user, access_token, jti
    
    def get_user_by_id(self, user_id: str) -> Optional[models.User]:
        """Get user by ID with caching"""
        cache_key = f"user:id:{user_id}"
        
        # Try cache first
        cached_user = cache.get(cache_key)
        if cached_user:
            return self.user_repo.get_by_id(user_id)
        
        # Get from database
        user = self.user_repo.get_by_id(user_id)
        if user:
            self._cache_user(user)
        
        return user
    
    def create_password_reset_token(self, email: str) -> Optional[models.PasswordResetToken]:
        """
        Create password reset token for user.
        Returns token object if user exists, None otherwise.
        """
        user = self.user_repo.get_by_email(email)
        if not user:
            return None
        
        # Generate secure token
        token = secrets.token_urlsafe(32)
        
        # Set expiration (1 hour from now)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        
        # Create token
        reset_token = models.PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        
        reset_token = self.token_repo.create(reset_token)
        
        logger.info(f"Password reset token created for user: {email}")
        return reset_token
    
    def reset_password(self, token: str, new_password: str) -> bool:
        """
        Reset password using reset token.
        Returns True if successful, False otherwise.
        """
        # Get reset token
        reset_token = self.token_repo.get_by_token(token)
        
        if not reset_token:
            return False
        
        # Check if token is expired
        if reset_token.expires_at < datetime.utcnow():
            return False
        
        # Get user
        user = self.user_repo.get_by_id(str(reset_token.user_id))
        if not user:
            return False
        
        # Update password
        user.hashed_password = get_password_hash(new_password)
        self.user_repo.update(user)
        
        # Mark token as used
        self.token_repo.mark_as_used(reset_token)
        
        # Invalidate user cache
        self._invalidate_user_cache(user)
        
        logger.info(f"Password reset successfully for user: {user.email}")
        return True
    
    def _cache_user(self, user: models.User) -> None:
        """Cache user data"""
        user_data = {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active
        }
        cache.set(f"user:id:{user.id}", user_data, ttl=600)  # 10 minutes
        cache.set(f"user:email:{user.email}", user_data, ttl=600)
    
    def _invalidate_user_cache(self, user: models.User) -> None:
        """Invalidate all cache entries for a user"""
        cache.delete(f"user:id:{user.id}")
        cache.delete(f"user:email:{user.email}")
    
    def _create_session(self, user_id: str, jti: str, request: Request) -> models.UserSession:
        """Create a new user session"""
        device_name, user_agent, ip_address = get_device_info(request)
        
        # Calculate expiration (30 days for sessions)
        expires_at = datetime.utcnow() + timedelta(days=30)
        
        session = models.UserSession(
            user_id=user_id,
            token_id=jti,
            device_name=device_name,
            user_agent=user_agent,
            ip_address=ip_address,
            is_active=True,
            expires_at=expires_at
        )
        
        return self.session_repo.create(session)
    
    def get_user_sessions(self, user_id: str) -> List[models.UserSession]:
        """Get all active sessions for a user"""
        return self.session_repo.get_active_sessions(user_id)
    
    def revoke_session(self, session_id: str, user_id: str) -> bool:
        """Revoke a specific session"""
        return self.session_repo.revoke_session(session_id, user_id)
    
    def revoke_all_sessions(self, user_id: str, exclude_token_id: Optional[str] = None) -> int:
        """Revoke all sessions for a user"""
        return self.session_repo.revoke_all_sessions(user_id, exclude_token_id)
    
    def update_session_activity(self, token_id: str) -> None:
        """Update session last used timestamp"""
        session = self.session_repo.get_by_token_id(token_id)
        if session:
            self.session_repo.update_last_used(session)
    
    def _log_login_attempt(
        self,
        email: str,
        user_id: Optional[str],
        success: bool,
        failure_reason: Optional[str],
        ip_address: Optional[str],
        user_agent: Optional[str],
        device_name: Optional[str]
    ) -> None:
        """Log a login attempt to history"""
        history_entry = models.LoginHistory(
            user_id=user_id,
            email=email,
            success=success,
            ip_address=ip_address,
            user_agent=user_agent,
            device_name=device_name,
            failure_reason=failure_reason
        )
        self.history_repo.create(history_entry)
    
    def get_login_history(self, user_id: str, limit: int = 50) -> List[models.LoginHistory]:
        """Get login history for a user"""
        return self.history_repo.get_by_user_id(user_id, limit)


class ProductService:
    """Product management service"""
    
    def __init__(self, db: Session):
        self.db = db
        self.product_repo = ProductRepository(db)
    
    def get_product_by_barcode(self, barcode: str) -> Optional[models.Product]:
        """Get product by barcode with caching"""
        cache_key = f"product:barcode:{barcode}"
        
        # Try cache first
        cached_product = cache.get(cache_key)
        if cached_product:
            return self.product_repo.get_by_barcode(barcode)
        
        # Get from database
        product = self.product_repo.get_by_barcode(barcode)
        if product:
            product_data = {
                "id": str(product.id),
                "barcode": product.barcode,
                "brand": product.brand,
                "model": product.model
            }
            cache.set(cache_key, product_data, ttl=1800)  # 30 minutes
        
        return product
    
    def create_product(self, barcode: str, brand: str = None, model: str = None) -> models.Product:
        """Create new product"""
        product = models.Product(
            barcode=barcode,
            brand=brand,
            model=model
        )
        product = self.product_repo.create(product)
        
        logger.info(f"Product created: {barcode}")
        return product

