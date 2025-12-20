"""
Shared test fixtures and configuration
"""
import os
from datetime import datetime, timedelta
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Configure testing env before importing the app
os.environ["TESTING"] = "true"

from app.main import app  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app import models  # noqa: E402
from app.core.security import create_access_token, get_password_hash  # noqa: E402

# Create an in-memory test database (unique per session)
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def _create_user_with_session(
    db: Session,
    *,
    email="test@example.com",
    username=None,
    password="password123",
    role="user",
    is_active=True
):
    """Helper to create a user and active session for authenticated requests."""
    if username is None:
        username = f"testuser_{uuid4().hex[:8]}"
    
    user = models.User(
        email=email,
        username=username,
        hashed_password=get_password_hash(password),
        is_active=is_active,
        role=role,
        gdpr_consent=True,
        age_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token, jti = create_access_token(data={"sub": str(user.id)})
    session = models.UserSession(
        user_id=user.id,
        token_id=jti,
        device_name="Test Device",
        user_agent="pytest",
        ip_address="127.0.0.1",
        is_active=True,
        expires_at=datetime.utcnow() + timedelta(days=1),
    )
    db.add(session)
    db.commit()
    return user, token


def override_get_db():
    """Override for dependency injection in tests."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def clean_db():
    """Clean database before and after each test."""
    # Drop all tables (in-memory database, so no file conflicts)
    Base.metadata.drop_all(bind=test_engine)
    
    # Create fresh tables
    Base.metadata.create_all(bind=test_engine)
    
    # Override the get_db dependency
    app.dependency_overrides[get_db] = override_get_db
    
    yield
    
    # Cleanup
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)


@pytest.fixture
def db_session():
    """Database session fixture."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_user(db_session):
    """Create a test user and return user and token."""
    return _create_user_with_session(db_session)


@pytest.fixture
def auth_header(test_user):
    """Authentication header fixture."""
    _, token = test_user
    return {"Authorization": f"Bearer {token}"}
