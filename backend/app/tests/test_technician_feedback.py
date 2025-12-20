import os
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Configure testing env before importing the app
os.environ["TESTING"] = "true"

from app.main import app  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app import models  # noqa: E402
from app.core.security import create_access_token, get_password_hash  # noqa: E402

# Create an in-memory SQLite database for this test module only
# Using StaticPool ensures the same connection is reused (needed for in-memory SQLite)
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def _create_technician_user(db, email: str = "tech@example.com", username: str = None):
    """Helper to create a technician user with active session."""
    if username is None:
        username = f"tech_{uuid4().hex[:8]}"
    
    user = models.User(
        email=email,
        username=username,
        hashed_password=get_password_hash("password123"),
        is_active=True,
        enterprise_role="technician",
        enterprise_id=str(uuid4()),
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
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_test_db(request):
    """Setup test database - uses in-memory SQLite, named differently to avoid conftest.py conflict."""
    # Drop all tables first to ensure clean state
    Base.metadata.drop_all(bind=test_engine)
    
    # Create fresh tables
    Base.metadata.create_all(bind=test_engine)
    
    # Override the dependency
    app.dependency_overrides[get_db] = override_get_db
    
    yield
    
    # Cleanup
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def technician_auth_header():
    with TestingSessionLocal() as db:
        _, token = _create_technician_user(db)
    return {"Authorization": f"Bearer {token}"}


def test_submit_feedback_success(client, technician_auth_header):
    """Test successful feedback submission"""
    payload = {
        "rating": 5,
        "comment": "Great AI assistance!",
        "diagnosis_correct": True,
        "parts_sufficient": True,
        "second_trip_required": False,
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    assert response.status_code == 201
    data = response.json()
    assert data["rating"] == 5
    assert data["comment"] == "Great AI assistance!"
    assert data["diagnosis_correct"] is True


def test_submit_feedback_with_incorrect_diagnosis(client, technician_auth_header):
    """Test feedback submission when diagnosis was incorrect"""
    payload = {
        "rating": 3,
        "comment": "Diagnosis was wrong",
        "diagnosis_correct": False,
        "parts_sufficient": False,
        "second_trip_required": True,
        "actual_problem": "Motor arızası",
        "actual_solution": "Motor değişimi gerekli",
        "actual_reason": "AI yanlış tanı koydu",
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    assert response.status_code == 201
    data = response.json()
    assert data["diagnosis_correct"] is False
    assert data["actual_problem"] == "Motor arızası"
    assert data["actual_solution"] == "Motor değişimi gerekli"


def test_submit_feedback_missing_required_fields(client, technician_auth_header):
    """Test that actual_problem and actual_solution are required when diagnosis is incorrect"""
    payload = {
        "rating": 2,
        "diagnosis_correct": False,
        # Missing actual_problem and actual_solution
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    assert response.status_code == 400
    assert "required" in response.json()["detail"].lower()


def test_validation_fails_for_invalid_rating(client, technician_auth_header):
    """Test that rating must be between 1 and 5"""
    payload = {
        "rating": 6,
        "diagnosis_correct": True,
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    # Pydantic validation returns 422, service validation returns 400
    assert response.status_code in [400, 422]


def test_requires_technician_role(client):
    """Test that non-technician users cannot submit feedback"""
    # Create a regular user (not a technician, no enterprise_id)
    with TestingSessionLocal() as db:
        user = models.User(
            email="user@example.com",
            username=f"user_{uuid4().hex[:8]}",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            role="user",
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

    auth_header = {"Authorization": f"Bearer {token}"}
    payload = {"rating": 5, "diagnosis_correct": True}

    response = client.post("/api/technicians/feedback", json=payload, headers=auth_header)

    assert response.status_code == 403
    # User without enterprise_id gets "Enterprise access required"
    detail = response.json()["detail"]
    assert "Enterprise access required" in detail or "enterprise" in detail.lower()


def test_list_feedback_returns_current_technician_only(client, technician_auth_header):
    """Test that technicians only see their own feedback"""
    # Submit feedback
    payload = {
        "rating": 4,
        "comment": "My feedback",
        "diagnosis_correct": True,
    }
    client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    # Create another technician and their feedback
    with TestingSessionLocal() as db:
        other_tech, other_token = _create_technician_user(
            db, email="other@example.com", username=f"other_{uuid4().hex[:8]}"
        )
        other_feedback = models.TechnicianFeedback(
            technician_id=other_tech.id,
            rating=3,
            comment="Other tech feedback",
            diagnosis_correct=True,
        )
        db.add(other_feedback)
        db.commit()

    # List feedback - should only see own feedback
    response = client.get("/api/technicians/feedback", headers=technician_auth_header)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["comment"] == "My feedback"


def test_get_feedback_by_id(client, technician_auth_header):
    """Test getting a specific feedback entry by ID"""
    # Submit feedback
    payload = {
        "rating": 5,
        "comment": "Test feedback",
        "diagnosis_correct": True,
    }
    create_response = client.post(
        "/api/technicians/feedback", json=payload, headers=technician_auth_header
    )
    feedback_id = create_response.json()["id"]

    # Get feedback by ID
    response = client.get(
        f"/api/technicians/feedback/{feedback_id}", headers=technician_auth_header
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == feedback_id
    assert data["comment"] == "Test feedback"


def test_cannot_access_other_technician_feedback(client, technician_auth_header):
    """Test that technicians cannot access feedback from other technicians"""
    # Create another technician and their feedback
    with TestingSessionLocal() as db:
        other_tech, other_token = _create_technician_user(
            db, email="other2@example.com", username=f"other2_{uuid4().hex[:8]}"
        )
        other_feedback = models.TechnicianFeedback(
            technician_id=other_tech.id,
            rating=3,
            comment="Other tech feedback",
            diagnosis_correct=True,
        )
        db.add(other_feedback)
        db.commit()
        other_feedback_id = str(other_feedback.id)

    # Try to access other technician's feedback
    response = client.get(
        f"/api/technicians/feedback/{other_feedback_id}", headers=technician_auth_header
    )

    assert response.status_code == 404


def test_submit_feedback_with_all_fields(client, technician_auth_header):
    """Test submitting feedback with all optional fields filled"""
    payload = {
        "rating": 4,
        "comment": "Comprehensive feedback",
        "diagnosis_correct": False,
        "parts_sufficient": False,
        "second_trip_required": True,
        "actual_problem": "Compressor failure",
        "actual_reason": "Worn out over time",
        "actual_solution": "Replaced compressor",
        "actual_parts_needed": "New compressor unit",
        "field_trip_was_required": True,
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    assert response.status_code == 201
    data = response.json()
    assert data["rating"] == 4
    assert data["comment"] == "Comprehensive feedback"
    assert data["diagnosis_correct"] is False
    assert data["parts_sufficient"] is False
    assert data["second_trip_required"] is True
    assert data["actual_problem"] == "Compressor failure"
    assert data["actual_reason"] == "Worn out over time"
    assert data["actual_solution"] == "Replaced compressor"
    assert data["actual_parts_needed"] == "New compressor unit"
    assert data["field_trip_was_required"] is True


def test_submit_feedback_with_chat_session_id(client, technician_auth_header):
    """Test submitting feedback with chat_session_id"""
    chat_session_id = str(uuid4())
    payload = {
        "rating": 5,
        "comment": "Feedback with session",
        "diagnosis_correct": True,
        "chat_session_id": chat_session_id,
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    assert response.status_code == 201
    data = response.json()
    assert data["chat_session_id"] == chat_session_id


def test_submit_feedback_minimal_required_fields(client, technician_auth_header):
    """Test submitting feedback with only required fields"""
    payload = {
        "rating": 3,
        "diagnosis_correct": True,
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    assert response.status_code == 201
    data = response.json()
    assert data["rating"] == 3
    assert data["diagnosis_correct"] is True
    assert data["comment"] is None
    assert data["parts_sufficient"] is True  # default
    assert data["second_trip_required"] is False  # default


def test_validation_fails_for_rating_zero(client, technician_auth_header):
    """Test that rating 0 is invalid"""
    payload = {
        "rating": 0,
        "diagnosis_correct": True,
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    # Pydantic validation returns 422, service validation returns 400
    assert response.status_code in [400, 422]


def test_validation_fails_for_rating_negative(client, technician_auth_header):
    """Test that negative rating is invalid"""
    payload = {
        "rating": -1,
        "diagnosis_correct": True,
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    # Pydantic validation returns 422, service validation returns 400
    assert response.status_code in [400, 422]
    if response.status_code == 400:
        assert "Rating must be between 1 and 5" in response.json()["detail"]


def test_validation_fails_for_rating_boundary_values(client, technician_auth_header):
    """Test rating boundary values (1 and 5 are valid)"""
    # Test rating 1 (valid)
    payload1 = {"rating": 1, "diagnosis_correct": True}
    response1 = client.post("/api/technicians/feedback", json=payload1, headers=technician_auth_header)
    assert response1.status_code == 201

    # Test rating 5 (valid)
    payload5 = {"rating": 5, "diagnosis_correct": True}
    response5 = client.post("/api/technicians/feedback", json=payload5, headers=technician_auth_header)
    assert response5.status_code == 201


def test_validation_requires_actual_problem_when_diagnosis_incorrect(client, technician_auth_header):
    """Test that actual_problem is required when diagnosis is incorrect"""
    payload = {
        "rating": 2,
        "diagnosis_correct": False,
        "actual_solution": "Solution provided",
        # Missing actual_problem
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    assert response.status_code == 400
    assert "required" in response.json()["detail"].lower()


def test_validation_requires_actual_solution_when_diagnosis_incorrect(client, technician_auth_header):
    """Test that actual_solution is required when diagnosis is incorrect"""
    payload = {
        "rating": 2,
        "diagnosis_correct": False,
        "actual_problem": "Problem provided",
        # Missing actual_solution
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    assert response.status_code == 400
    assert "required" in response.json()["detail"].lower()


def test_submit_feedback_with_parts_not_sufficient(client, technician_auth_header):
    """Test submitting feedback when parts were not sufficient"""
    payload = {
        "rating": 3,
        "diagnosis_correct": True,
        "parts_sufficient": False,
        "actual_parts_needed": "Additional capacitor needed",
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    assert response.status_code == 201
    data = response.json()
    assert data["parts_sufficient"] is False
    assert data["actual_parts_needed"] == "Additional capacitor needed"


def test_senior_technician_can_submit_feedback(client):
    """Test that senior_technician role can also submit feedback"""
    with TestingSessionLocal() as db:
        user = models.User(
            email="senior@example.com",
            username=f"senior_{uuid4().hex[:8]}",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            enterprise_role="senior_technician",
            enterprise_id=str(uuid4()),
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

    auth_header = {"Authorization": f"Bearer {token}"}
    payload = {"rating": 5, "diagnosis_correct": True}

    response = client.post("/api/technicians/feedback", json=payload, headers=auth_header)

    assert response.status_code == 201
    data = response.json()
    assert data["rating"] == 5


def test_list_feedback_with_limit(client, technician_auth_header):
    """Test listing feedback with custom limit"""
    # Create multiple feedback entries
    for i in range(5):
        payload = {
            "rating": 4,
            "comment": f"Feedback {i}",
            "diagnosis_correct": True,
        }
        client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    # List with limit 3
    response = client.get("/api/technicians/feedback?limit=3", headers=technician_auth_header)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3


def test_list_feedback_empty(client, technician_auth_header):
    """Test listing feedback when none exists"""
    response = client.get("/api/technicians/feedback", headers=technician_auth_header)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_list_feedback_ordered_by_created_at_desc(client, technician_auth_header):
    """Test that feedback list is ordered by created_at descending"""
    # Create feedback entries
    feedback_ids = []
    for i in range(3):
        payload = {
            "rating": 4,
            "comment": f"Feedback {i}",
            "diagnosis_correct": True,
        }
        response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)
        feedback_ids.append(response.json()["id"])

    # List feedback
    response = client.get("/api/technicians/feedback", headers=technician_auth_header)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    # Should be in reverse order (newest first) - verify timestamps are descending
    timestamps = [item["created_at"] for item in data]
    assert timestamps == sorted(timestamps, reverse=True)
    # Verify all feedback IDs are present
    returned_ids = [item["id"] for item in data]
    assert set(returned_ids) == set(feedback_ids)


def test_submit_feedback_requires_authentication(client):
    """Test that submitting feedback requires authentication"""
    payload = {"rating": 5, "diagnosis_correct": True}

    response = client.post("/api/technicians/feedback", json=payload)

    # HTTPBearer returns 403 when no credentials are provided
    assert response.status_code == 403


def test_list_feedback_requires_authentication(client):
    """Test that listing feedback requires authentication"""
    response = client.get("/api/technicians/feedback")

    # HTTPBearer returns 403 when no credentials are provided
    assert response.status_code == 403


def test_get_feedback_requires_authentication(client):
    """Test that getting feedback requires authentication"""
    feedback_id = str(uuid4())
    response = client.get(f"/api/technicians/feedback/{feedback_id}")

    # HTTPBearer returns 403 when no credentials are provided
    assert response.status_code == 403


def test_submit_feedback_with_invalid_token(client):
    """Test submitting feedback with invalid token"""
    auth_header = {"Authorization": "Bearer invalid_token"}
    payload = {"rating": 5, "diagnosis_correct": True}

    response = client.post("/api/technicians/feedback", json=payload, headers=auth_header)

    assert response.status_code == 401


def test_submit_feedback_with_optional_fields_none(client, technician_auth_header):
    """Test that optional fields can be None/null"""
    payload = {
        "rating": 3,
        "diagnosis_correct": True,
        "comment": None,
        "actual_problem": None,
        "actual_solution": None,
        "actual_parts_needed": None,
        "field_trip_was_required": None,
    }

    response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)

    assert response.status_code == 201
    data = response.json()
    assert data["rating"] == 3
    assert data["comment"] is None


def test_get_feedback_returns_all_fields(client, technician_auth_header):
    """Test that get_feedback returns all feedback fields"""
    # Create feedback with all fields
    payload = {
        "rating": 4,
        "comment": "Full feedback",
        "diagnosis_correct": False,
        "parts_sufficient": False,
        "second_trip_required": True,
        "actual_problem": "Test problem",
        "actual_reason": "Test reason",
        "actual_solution": "Test solution",
        "actual_parts_needed": "Test parts",
        "field_trip_was_required": True,
    }
    create_response = client.post("/api/technicians/feedback", json=payload, headers=technician_auth_header)
    feedback_id = create_response.json()["id"]

    # Get feedback
    response = client.get(f"/api/technicians/feedback/{feedback_id}", headers=technician_auth_header)

    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "technician_id" in data
    assert "rating" in data
    assert "comment" in data
    assert "diagnosis_correct" in data
    assert "parts_sufficient" in data
    assert "second_trip_required" in data
    assert "actual_problem" in data
    assert "actual_reason" in data
    assert "actual_solution" in data
    assert "actual_parts_needed" in data
    assert "field_trip_was_required" in data
    assert "created_at" in data

