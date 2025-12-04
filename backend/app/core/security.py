"""
Security utilities: JWT authentication, password hashing, and rate limiting
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
import os
import bcrypt
import uuid
import re
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


# Password Hashing Functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


# JWT Token Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None, jti: Optional[str] = None) -> Tuple[str, str]:
    """
    Create JWT access token with expiration and JWT ID (jti).
    
    Args:
        data: Token payload data
        expires_delta: Optional custom expiration time
        jti: Optional JWT ID (if not provided, generates a new UUID)
    
    Returns:
        Tuple of (encoded_jwt, jti)
    """
    to_encode = data.copy()
    
    # Generate JWT ID if not provided
    if jti is None:
        jti = str(uuid.uuid4())
    
    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "jti": jti,  # JWT ID for session tracking
        "iat": datetime.utcnow()  # Issued at time
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, jti


def get_device_info(request: Request) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Extract device information from request.
    
    Returns:
        Tuple of (device_name, user_agent, ip_address)
    """
    if not request:
        return None, None, None
    
    user_agent = request.headers.get("user-agent", "")
    ip_address = get_remote_address(request)
    
    # Parse device name from user agent
    device_name = None
    if user_agent:
        # Try to extract browser and OS
        browser_match = re.search(r'(Chrome|Firefox|Safari|Edge|Opera)[/\s](\d+)', user_agent)
        os_match = re.search(r'(Windows|Mac OS|Linux|Android|iOS)', user_agent)
        
        browser = browser_match.group(1) if browser_match else "Unknown Browser"
        os_name = os_match.group(1) if os_match else "Unknown OS"
        device_name = f"{browser} on {os_name}"
    
    return device_name, user_agent, ip_address


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# Rate Limiting Configuration
# Check if we're in test mode
TESTING = os.getenv("TESTING", "false").lower() == "true" or os.getenv("ENVIRONMENT", "").lower() == "test"

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/hour"],  # General API rate limit
    storage_uri=os.getenv("RATE_LIMIT_STORAGE_URI", "memory://")  # Can be "redis://localhost:6379" for Redis
)

# Rate limit configurations for authentication endpoints
AUTH_RATE_LIMITS = {
    "login": "5/minute",  # 5 login attempts per minute per IP
    "register": "3/minute",  # 3 registration attempts per minute per IP
    "password_reset": "3/hour",  # 3 password reset requests per hour per IP
    "guest_login": "10/minute",  # 10 guest login attempts per minute per IP
}


def get_rate_limit_decorator(limit: str):
    """
    Get a rate limit decorator that is disabled in test mode.
    
    Args:
        limit: Rate limit string (e.g., "5/minute")
    
    Returns:
        Decorator function that applies rate limiting (or no-op in test mode)
    """
    if TESTING:
        # Return a no-op decorator in test mode
        def noop_decorator(func):
            return func
        return noop_decorator
    else:
        # Return the actual rate limiter decorator
        return limiter.limit(limit)


def get_rate_limit_handler(app):
    """Add rate limit exception handler to the FastAPI app"""
    if not TESTING:
        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    return app

