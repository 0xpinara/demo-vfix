import os
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

# Configure testing env before importing the app
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TEST_DB_PATH = os.path.join(BASE_DIR, "test_feedback.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
os.environ["TESTING"] = "true"

from app.main import app  # noqa: E402
from app.database import Base, engine, SessionLocal  # noqa: E402
from app import models  # noqa: E402
from app.core.security import create_access_token, get_password_hash  # noqa: E402


def _create_user_with_session(db: SessionLocal, *, email="test@example.com", username="testuser"):
    """Helper to seed a user and active session for authenticated requests."""
    user = models.User(
        email=email,
        username=username,
        hashed_password=get_password_hash("password123"),
        is_active=True,
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
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_header():
    with SessionLocal() as db:
        _, token = _create_user_with_session(db)
    return {"Authorization": f"Bearer {token}"}


def test_submit_feedback_creates_entry(client, auth_header):
    payload = {
        "session_id": "chat-123",
        "rating": 5,
        "comment": "Great help!",
        "session_title": "Washer issue",
    }

    response = client.post("/api/chat/feedback", json=payload, headers=auth_header)

    assert response.status_code == 201
    data = response.json()
    assert data["session_id"] == payload["session_id"]
    assert data["rating"] == payload["rating"]
    assert data["comment"] == payload["comment"]


def test_feedback_is_upserted_when_existing(client, auth_header):
    payload = {"session_id": "chat-abc", "rating": 4, "comment": "Good"}
    response = client.post("/api/chat/feedback", json=payload, headers=auth_header)
    assert response.status_code == 201

    updated = {**payload, "rating": 2, "comment": "Could be better"}
    response = client.post("/api/chat/feedback", json=updated, headers=auth_header)
    assert response.status_code == 201
    data = response.json()
    assert data["rating"] == 2
    assert data["comment"] == "Could be better"


def test_get_feedback_for_session(client, auth_header):
    payload = {"session_id": "chat-xyz", "rating": 3, "comment": "okay"}
    client.post("/api/chat/feedback", json=payload, headers=auth_header)

    response = client.get("/api/chat/feedback/chat-xyz", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "chat-xyz"
    assert data["rating"] == 3


def test_validation_fails_for_invalid_rating(client, auth_header):
    payload = {"session_id": "chat-oops", "rating": 6, "comment": "invalid"}
    response = client.post("/api/chat/feedback", json=payload, headers=auth_header)

    assert response.status_code == 400
    assert "Rating must be between 1 and 5" in response.json()["detail"]


def test_requires_authentication(client):
    payload = {"session_id": "chat-noauth", "rating": 4}
    response = client.post("/api/chat/feedback", json=payload)
    assert response.status_code in (401, 403)


def test_list_feedback_returns_current_user_only(client, auth_header):
    with SessionLocal() as db:
        other_user, other_token = _create_user_with_session(
            db,
            email="second@example.com",
            username="seconduser",
        )

    # Create feedback for current user
    client.post(
        "/api/chat/feedback",
        json={"session_id": "mine-1", "rating": 5},
        headers=auth_header,
    )
    # Create feedback for another user
    client.post(
        "/api/chat/feedback",
        json={"session_id": "other-1", "rating": 4},
        headers={"Authorization": f"Bearer {other_token}"},
    )

    response = client.get("/api/chat/feedback", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["feedback"][0]["session_id"] == "mine-1"


def test_cannot_fetch_feedback_of_other_user(client, auth_header):
    with SessionLocal() as db:
        other_user, other_token = _create_user_with_session(
            db,
            email="third@example.com",
            username="thirduser",
        )

    client.post(
        "/api/chat/feedback",
        json={"session_id": "shared-session", "rating": 4},
        headers={"Authorization": f"Bearer {other_token}"},
    )

    response = client.get("/api/chat/feedback/shared-session", headers=auth_header)
    assert response.status_code == 404


def test_comment_optional_and_title_persisted(client, auth_header):
    payload = {"session_id": "chat-title", "rating": 5, "session_title": "My Chat"}
    response = client.post("/api/chat/feedback", json=payload, headers=auth_header)
    assert response.status_code == 201

    fetched = client.get("/api/chat/feedback/chat-title", headers=auth_header).json()
    assert fetched["session_title"] == "My Chat"

