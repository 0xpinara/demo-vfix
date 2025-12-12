"""
Shared test fixtures and configuration
"""
import os
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Configure testing env before importing the app
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TEST_DB_PATH = os.path.join(BASE_DIR, "test_api.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["TESTING"] = "true"

from app.main import app  # noqa: E402
from app.database import Base, engine, SessionLocal  # noqa: E402
from app import models  # noqa: E402
from app.core.security import create_access_token, get_password_hash  # noqa: E402


def _create_user_with_session(
    db: Session,
    *,
    email="test@example.com",
    username="testuser",
    password="password123",
    role="user",
    is_active=True
):
    """Helper to create a user and active session for authenticated requests."""
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


@pytest.fixture(autouse=True)
def clean_db():
    """Clean database before and after each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)


@pytest.fixture
def db_session():
    """Database session fixture."""
    with SessionLocal() as db:
        yield db


@pytest.fixture
def test_user(db_session):
    """Create a test user and return user and token."""
    return _create_user_with_session(db_session)


@pytest.fixture
def auth_header(test_user):
    """Authentication header fixture."""
    _, token = test_user
    return {"Authorization": f"Bearer {token}"}
