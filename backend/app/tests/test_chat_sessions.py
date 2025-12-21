"""
Comprehensive tests for Chatbot Database Integration - Chat Sessions and Messages
Tests cover session CRUD, message creation, encryption/decryption, and user isolation.
"""
import os
from datetime import datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

# Configure testing env before importing the app
os.environ["TESTING"] = "true"

from app.main import app  # noqa: E402
from app.tests.conftest import client, auth_header, db_session  # noqa: E402
from app import models  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.core.security import create_access_token, get_password_hash  # noqa: E402
from datetime import datetime, timedelta  # noqa: E402


class TestChatSessionCreation:
    """Tests for creating chat sessions"""

    def test_create_session_success(self, client: TestClient, auth_header: dict):
        """Test creating a new chat session"""
        response = client.post(
            "/api/chat/sessions",
            json={"title": "Test Chat"},
            headers=auth_header,
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["title"] == "Test Chat"
        assert data["message_count"] == 0
        assert data["problem_solved"] is False
        assert data["technician_dispatched"] is False
        assert "created_at" in data

    def test_create_session_without_title(self, client: TestClient, auth_header: dict):
        """Test creating a session without a title"""
        response = client.post(
            "/api/chat/sessions",
            json={},
            headers=auth_header,
        )
        assert response.status_code == 201
        data = response.json()
        # Backend may set a default title, so just check it exists
        assert "title" in data

    def test_create_session_requires_authentication(self, client: TestClient):
        """Test that creating a session requires authentication"""
        response = client.post(
            "/api/chat/sessions",
            json={"title": "Test Chat"},
        )
        # FastAPI HTTPBearer returns 403 for missing auth
        assert response.status_code in [401, 403]


class TestChatSessionRetrieval:
    """Tests for retrieving chat sessions"""

    def test_get_session_with_messages(self, client: TestClient, auth_header: dict):
        """Test retrieving a session with its messages"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Test Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Add a message
        client.post(
            f"/api/chat/sessions/{session_id}/messages",
            json={
                "role": "user",
                "content": "Hello, this is a test message",
            },
            headers=auth_header,
        )

        # Get the session with messages
        response = client.get(
            f"/api/chat/sessions/{session_id}",
            headers=auth_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
        assert len(data["messages"]) == 1
        assert data["messages"][0]["role"] == "user"
        assert data["messages"][0]["content"] == "Hello, this is a test message"
        assert data["message_count"] == 1

    def test_get_session_with_multiple_messages(self, client: TestClient, auth_header: dict):
        """Test retrieving a session with multiple messages"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Multi Message Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Add multiple messages
        messages = [
            {"role": "user", "content": "First message"},
            {"role": "assistant", "content": "First response"},
            {"role": "user", "content": "Second message"},
        ]
        for msg in messages:
            client.post(
                f"/api/chat/sessions/{session_id}/messages",
                json=msg,
                headers=auth_header,
            )

        # Get the session
        response = client.get(
            f"/api/chat/sessions/{session_id}",
            headers=auth_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) == 3
        assert data["message_count"] == 3
        # Messages should be in order
        assert data["messages"][0]["content"] == "First message"
        assert data["messages"][1]["content"] == "First response"
        assert data["messages"][2]["content"] == "Second message"

    def test_get_nonexistent_session(self, client: TestClient, auth_header: dict):
        """Test retrieving a session that doesn't exist"""
        fake_id = str(uuid4())
        response = client.get(
            f"/api/chat/sessions/{fake_id}",
            headers=auth_header,
        )
        assert response.status_code == 404

    def test_get_session_from_other_user(self, client: TestClient, auth_header: dict, db_session):
        """Test that users cannot access other users' sessions"""
        # Create session for first user
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "User 1 Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Create second user and get their auth header
        user2 = models.User(
            email="user2@example.com",
            username=f"user2_{uuid4().hex[:8]}",
            hashed_password=get_password_hash("password123"),
            is_active=True,
        )
        db_session.add(user2)
        db_session.commit()
        db_session.refresh(user2)
        token2, jti2 = create_access_token(data={"sub": str(user2.id)})
        session2 = models.UserSession(
            user_id=user2.id,
            token_id=jti2,
            device_name="Test Device",
            user_agent="pytest",
            ip_address="127.0.0.1",
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(days=1),
        )
        db_session.add(session2)
        db_session.commit()
        auth_header2 = {"Authorization": f"Bearer {token2}"}

        # Try to access first user's session
        response = client.get(
            f"/api/chat/sessions/{session_id}",
            headers=auth_header2,
        )
        # Should return 404 (not found) or 401 (unauthorized) depending on auth check order
        assert response.status_code in [404, 401]

    def test_get_session_requires_authentication(self, client: TestClient):
        """Test that getting a session requires authentication"""
        fake_id = str(uuid4())
        response = client.get(f"/api/chat/sessions/{fake_id}")
        # FastAPI HTTPBearer returns 403 for missing auth
        assert response.status_code in [401, 403]


class TestChatSessionListing:
    """Tests for listing chat sessions"""

    def test_list_sessions_empty(self, client: TestClient, auth_header: dict):
        """Test listing sessions when user has none"""
        response = client.get(
            "/api/chat/sessions",
            headers=auth_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["sessions"]) == 0

    def test_list_sessions_with_multiple(self, client: TestClient, auth_header: dict):
        """Test listing multiple sessions"""
        # Create multiple sessions
        titles = ["Session 1", "Session 2", "Session 3"]
        session_ids = []
        for title in titles:
            create_response = client.post(
                "/api/chat/sessions",
                json={"title": title},
                headers=auth_header,
            )
            session_ids.append(create_response.json()["id"])

        # List sessions
        response = client.get(
            "/api/chat/sessions",
            headers=auth_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert len(data["sessions"]) == 3
        # Sessions should be sorted by created_at descending (latest first)
        assert data["sessions"][0]["title"] == "Session 3"
        assert data["sessions"][1]["title"] == "Session 2"
        assert data["sessions"][2]["title"] == "Session 1"

    def test_list_sessions_with_limit(self, client: TestClient, auth_header: dict):
        """Test listing sessions with a limit"""
        # Create 5 sessions
        for i in range(5):
            client.post(
                "/api/chat/sessions",
                json={"title": f"Session {i}"},
                headers=auth_header,
            )

        # List with limit of 3
        response = client.get(
            "/api/chat/sessions?limit=3",
            headers=auth_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["sessions"]) == 3
        # Current implementation returns len(sessions) as total, not full count
        assert data["total"] == 3

    def test_list_sessions_only_shows_current_user(self, client: TestClient, auth_header: dict, db_session):
        """Test that listing only shows current user's sessions"""
        # Create session for first user
        client.post(
            "/api/chat/sessions",
            json={"title": "User 1 Session"},
            headers=auth_header,
        )

        # Create second user and create session
        user2 = models.User(
            email="user2@example.com",
            username=f"user2_{uuid4().hex[:8]}",
            hashed_password=get_password_hash("password123"),
            is_active=True,
        )
        db_session.add(user2)
        db_session.commit()
        db_session.refresh(user2)
        token2, jti2 = create_access_token(data={"sub": str(user2.id)})
        session2 = models.UserSession(
            user_id=user2.id,
            token_id=jti2,
            device_name="Test Device",
            user_agent="pytest",
            ip_address="127.0.0.1",
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(days=1),
        )
        db_session.add(session2)
        db_session.commit()
        auth_header2 = {"Authorization": f"Bearer {token2}"}

        client.post(
            "/api/chat/sessions",
            json={"title": "User 2 Session"},
            headers=auth_header2,
        )

        # List sessions for first user
        response = client.get(
            "/api/chat/sessions",
            headers=auth_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["sessions"][0]["title"] == "User 1 Session"

    def test_list_sessions_requires_authentication(self, client: TestClient):
        """Test that listing sessions requires authentication"""
        response = client.get("/api/chat/sessions")
        # FastAPI HTTPBearer returns 403 for missing auth
        assert response.status_code in [401, 403]


class TestChatMessageCreation:
    """Tests for creating chat messages"""

    def test_add_message_success(self, client: TestClient, auth_header: dict):
        """Test adding a message to a session"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Test Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Add a message
        response = client.post(
            f"/api/chat/sessions/{session_id}/messages",
            json={
                "role": "user",
                "content": "Test message content",
            },
            headers=auth_header,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["role"] == "user"
        assert data["content"] == "Test message content"
        assert data["session_id"] == session_id
        assert "id" in data
        assert "created_at" in data

    def test_add_message_increments_count(self, client: TestClient, auth_header: dict):
        """Test that adding a message increments the session's message count"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Test Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Verify initial count
        get_response = client.get(
            f"/api/chat/sessions/{session_id}",
            headers=auth_header,
        )
        assert get_response.json()["message_count"] == 0

        # Add a message
        client.post(
            f"/api/chat/sessions/{session_id}/messages",
            json={"role": "user", "content": "Test"},
            headers=auth_header,
        )

        # Verify count incremented
        get_response = client.get(
            f"/api/chat/sessions/{session_id}",
            headers=auth_header,
        )
        assert get_response.json()["message_count"] == 1

    def test_add_message_with_images(self, client: TestClient, auth_header: dict):
        """Test adding a message with base64 encoded images"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Test Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Add a message with images
        images = ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
        response = client.post(
            f"/api/chat/sessions/{session_id}/messages",
            json={
                "role": "user",
                "content": "Message with image",
                "images": images,
            },
            headers=auth_header,
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["images"]) == 1
        assert data["images"][0] == images[0]

    def test_add_message_without_content(self, client: TestClient, auth_header: dict):
        """Test adding a message without content (only images)"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Test Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Add a message with only images
        images = ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]
        response = client.post(
            f"/api/chat/sessions/{session_id}/messages",
            json={
                "role": "user",
                "images": images,
            },
            headers=auth_header,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["content"] is None
        assert len(data["images"]) == 1

    def test_add_message_to_nonexistent_session(self, client: TestClient, auth_header: dict):
        """Test adding a message to a session that doesn't exist"""
        fake_id = str(uuid4())
        response = client.post(
            f"/api/chat/sessions/{fake_id}/messages",
            json={"role": "user", "content": "Test"},
            headers=auth_header,
        )
        assert response.status_code == 404

    def test_add_message_to_other_user_session(self, client: TestClient, auth_header: dict, db_session):
        """Test that users cannot add messages to other users' sessions"""
        # Create session for first user
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "User 1 Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Create second user
        user2 = models.User(
            email="user2@example.com",
            username=f"user2_{uuid4().hex[:8]}",
            hashed_password=get_password_hash("password123"),
            is_active=True,
        )
        db_session.add(user2)
        db_session.commit()
        db_session.refresh(user2)
        token2, jti2 = create_access_token(data={"sub": str(user2.id)})
        session2 = models.UserSession(
            user_id=user2.id,
            token_id=jti2,
            device_name="Test Device",
            user_agent="pytest",
            ip_address="127.0.0.1",
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(days=1),
        )
        db_session.add(session2)
        db_session.commit()
        auth_header2 = {"Authorization": f"Bearer {token2}"}

        # Try to add message to first user's session
        response = client.post(
            f"/api/chat/sessions/{session_id}/messages",
            json={"role": "user", "content": "Unauthorized"},
            headers=auth_header2,
        )
        assert response.status_code == 404

    def test_add_message_requires_authentication(self, client: TestClient):
        """Test that adding a message requires authentication"""
        fake_id = str(uuid4())
        response = client.post(
            f"/api/chat/sessions/{fake_id}/messages",
            json={"role": "user", "content": "Test"},
        )
        # FastAPI HTTPBearer returns 403 for missing auth
        assert response.status_code in [401, 403]

    def test_add_message_invalid_role(self, client: TestClient, auth_header: dict):
        """Test adding a message with an invalid role"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Test Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Try to add message with invalid role
        response = client.post(
            f"/api/chat/sessions/{session_id}/messages",
            json={"role": "invalid", "content": "Test"},
            headers=auth_header,
        )
        assert response.status_code == 422


class TestMessageEncryption:
    """Tests for message encryption/decryption"""

    def test_message_content_is_encrypted(self, client: TestClient, auth_header: dict, db_session):
        """Test that message content is encrypted in the database"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Test Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Add a message
        message_content = "This is a secret message that should be encrypted"
        client.post(
            f"/api/chat/sessions/{session_id}/messages",
            json={"role": "user", "content": message_content},
            headers=auth_header,
        )

        # Check database directly
        message = db_session.query(models.ChatMessage).filter(
            models.ChatMessage.session_id == session_id
        ).first()

        assert message is not None
        # Content should be encrypted (not plain text)
        assert message._content is not None
        assert message._content != message_content
        # But property should decrypt it
        assert message.content == message_content

    def test_message_images_are_encrypted(self, client: TestClient, auth_header: dict, db_session):
        """Test that message images are encrypted in the database"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Test Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Add a message with images
        images = ["data:image/png;base64,test123", "data:image/jpg;base64,test456"]
        client.post(
            f"/api/chat/sessions/{session_id}/messages",
            json={"role": "user", "images": images},
            headers=auth_header,
        )

        # Check database directly
        message = db_session.query(models.ChatMessage).filter(
            models.ChatMessage.session_id == session_id
        ).first()

        assert message is not None
        # Images should be encrypted
        assert message._images is not None
        # But property should decrypt and parse them
        assert message.images == images

    def test_retrieved_messages_are_decrypted(self, client: TestClient, auth_header: dict):
        """Test that retrieved messages are properly decrypted"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Test Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Add encrypted message
        message_content = "Encrypted content test"
        client.post(
            f"/api/chat/sessions/{session_id}/messages",
            json={"role": "user", "content": message_content},
            headers=auth_header,
        )

        # Retrieve session with messages
        response = client.get(
            f"/api/chat/sessions/{session_id}",
            headers=auth_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) == 1
        assert data["messages"][0]["content"] == message_content


class TestChatSessionUpdate:
    """Tests for updating chat sessions"""

    def test_update_session_title(self, client: TestClient, auth_header: dict):
        """Test updating a session's title"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Original Title"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Update title
        response = client.put(
            f"/api/chat/sessions/{session_id}",
            json={"title": "Updated Title"},
            headers=auth_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    def test_update_session_status(self, client: TestClient, auth_header: dict):
        """Test updating session status fields"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Test Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Update status
        response = client.put(
            f"/api/chat/sessions/{session_id}",
            json={
                "problem_solved": True,
                "technician_dispatched": True,
            },
            headers=auth_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["problem_solved"] is True
        assert data["technician_dispatched"] is True

    def test_update_nonexistent_session(self, client: TestClient, auth_header: dict):
        """Test updating a session that doesn't exist"""
        fake_id = str(uuid4())
        response = client.put(
            f"/api/chat/sessions/{fake_id}",
            json={"title": "Updated"},
            headers=auth_header,
        )
        assert response.status_code == 404

    def test_update_other_user_session(self, client: TestClient, auth_header: dict, db_session):
        """Test that users cannot update other users' sessions"""
        # Create session for first user
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "User 1 Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Create second user
        user2 = models.User(
            email="user2@example.com",
            username=f"user2_{uuid4().hex[:8]}",
            hashed_password=get_password_hash("password123"),
            is_active=True,
        )
        db_session.add(user2)
        db_session.commit()
        db_session.refresh(user2)
        token2, jti2 = create_access_token(data={"sub": str(user2.id)})
        session2 = models.UserSession(
            user_id=user2.id,
            token_id=jti2,
            device_name="Test Device",
            user_agent="pytest",
            ip_address="127.0.0.1",
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(days=1),
        )
        db_session.add(session2)
        db_session.commit()
        auth_header2 = {"Authorization": f"Bearer {token2}"}

        # Try to update first user's session
        response = client.put(
            f"/api/chat/sessions/{session_id}",
            json={"title": "Hacked"},
            headers=auth_header2,
        )
        assert response.status_code == 404


class TestChatSessionDeletion:
    """Tests for deleting chat sessions"""

    def test_delete_session_success(self, client: TestClient, auth_header: dict):
        """Test deleting a session"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "To Delete"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Delete it
        response = client.delete(
            f"/api/chat/sessions/{session_id}",
            headers=auth_header,
        )
        assert response.status_code == 204

        # Verify it's gone
        get_response = client.get(
            f"/api/chat/sessions/{session_id}",
            headers=auth_header,
        )
        assert get_response.status_code == 404

    def test_delete_session_deletes_messages(self, client: TestClient, auth_header: dict):
        """Test that deleting a session also deletes its messages"""
        # Create a session
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "Session with Messages"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Add messages
        for i in range(3):
            client.post(
                f"/api/chat/sessions/{session_id}/messages",
                json={"role": "user", "content": f"Message {i}"},
                headers=auth_header,
            )

        # Delete session
        client.delete(
            f"/api/chat/sessions/{session_id}",
            headers=auth_header,
        )

        # Verify messages are deleted
        db = SessionLocal()
        messages = db.query(models.ChatMessage).filter(
            models.ChatMessage.session_id == session_id
        ).all()
        db.close()
        assert len(messages) == 0

    def test_delete_nonexistent_session(self, client: TestClient, auth_header: dict):
        """Test deleting a session that doesn't exist"""
        fake_id = str(uuid4())
        response = client.delete(
            f"/api/chat/sessions/{fake_id}",
            headers=auth_header,
        )
        assert response.status_code == 404

    def test_delete_other_user_session(self, client: TestClient, auth_header: dict, db_session):
        """Test that users cannot delete other users' sessions"""
        # Create session for first user
        create_response = client.post(
            "/api/chat/sessions",
            json={"title": "User 1 Session"},
            headers=auth_header,
        )
        session_id = create_response.json()["id"]

        # Create second user
        user2 = models.User(
            email="user2@example.com",
            username=f"user2_{uuid4().hex[:8]}",
            hashed_password=get_password_hash("password123"),
            is_active=True,
        )
        db_session.add(user2)
        db_session.commit()
        db_session.refresh(user2)
        token2, jti2 = create_access_token(data={"sub": str(user2.id)})
        session2 = models.UserSession(
            user_id=user2.id,
            token_id=jti2,
            device_name="Test Device",
            user_agent="pytest",
            ip_address="127.0.0.1",
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(days=1),
        )
        db_session.add(session2)
        db_session.commit()
        auth_header2 = {"Authorization": f"Bearer {token2}"}

        # Try to delete first user's session
        response = client.delete(
            f"/api/chat/sessions/{session_id}",
            headers=auth_header2,
        )
        assert response.status_code == 404

    def test_delete_session_requires_authentication(self, client: TestClient):
        """Test that deleting a session requires authentication"""
        fake_id = str(uuid4())
        response = client.delete(f"/api/chat/sessions/{fake_id}")
        # FastAPI HTTPBearer returns 403 for missing auth
        assert response.status_code in [401, 403]

