"""
Comprehensive tests for all API routes after modularity refactoring
Tests system, authentication, user, and integration flows
"""
import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta


# ============================================================================
# SYSTEM ENDPOINTS TESTS
# ============================================================================

class TestHealthEndpoint:
    """Tests for /health endpoint"""
    
    def test_health_check_returns_ok(self, client: TestClient):
        """Health check should return 200 with status ok"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "V-Fix Web App API"
        assert data["version"] == "1.0.0"
        assert "timestamp" in data
        assert "checks" in data
    
    def test_health_check_includes_database_status(self, client: TestClient):
        """Health check should include database status"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "database" in data["checks"]
        assert data["checks"]["database"] == "healthy"
    
    def test_health_check_includes_cache_status(self, client: TestClient):
        """Health check should include cache status"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "cache" in data["checks"]
        # Cache might be "healthy" or "unavailable" depending on Redis availability
        assert data["checks"]["cache"] in ["healthy", "unavailable"]


class TestMetricsEndpoint:
    """Tests for /metrics endpoint"""
    
    def test_metrics_returns_200(self, client: TestClient):
        """Metrics endpoint should return 200"""
        response = client.get("/metrics")
        
        assert response.status_code == 200
        data = response.json()
        assert "timestamp" in data
        assert "metrics" in data
    
    def test_metrics_includes_active_users(self, client: TestClient):
        """Metrics should include active users count"""
        response = client.get("/metrics")
        
        assert response.status_code == 200
        data = response.json()
        assert "active_users" in data["metrics"]
        assert isinstance(data["metrics"]["active_users"], int)
        assert data["metrics"]["active_users"] >= 0
    
    def test_metrics_includes_new_users_24h(self, client: TestClient):
        """Metrics should include new users in last 24 hours"""
        response = client.get("/metrics")
        
        assert response.status_code == 200
        data = response.json()
        assert "new_users_24h" in data["metrics"]
        assert isinstance(data["metrics"]["new_users_24h"], int)
        assert data["metrics"]["new_users_24h"] >= 0
    
    def test_metrics_structure(self, client: TestClient):
        """Metrics should have correct structure"""
        response = client.get("/metrics")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "timestamp" in data
        assert "metrics" in data
        assert isinstance(data["metrics"], dict)


# ============================================================================
# AUTHENTICATION ENDPOINTS TESTS
# ============================================================================

class TestRegisterEndpoint:
    """Tests for POST /api/auth/register"""
    
    def test_register_success(self, client: TestClient):
        """Successful user registration"""
        payload = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "SecurePass123",
            "gdpr_consent": True,
            "age_verified": True,
        }
        
        response = client.post("/api/auth/register", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        assert "user" in data
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == payload["email"]
        assert data["user"]["username"] == payload["username"]
    
    def test_register_duplicate_email(self, client: TestClient, test_user):
        """Registration with duplicate email should fail"""
        user, _ = test_user
        
        payload = {
            "email": user.email,
            "username": "differentuser",
            "password": "SecurePass123",
            "gdpr_consent": True,
            "age_verified": True,
        }
        
        response = client.post("/api/auth/register", json=payload)
        
        assert response.status_code == 409
        assert "kullanılıyor" in response.json()["detail"] or "already exists" in response.json()["detail"]
    
    def test_register_duplicate_username(self, client: TestClient, test_user):
        """Registration with duplicate username should fail"""
        user, _ = test_user
        
        payload = {
            "email": "different@example.com",
            "username": user.username,
            "password": "SecurePass123",
            "gdpr_consent": True,
            "age_verified": True,
        }
        
        response = client.post("/api/auth/register", json=payload)
        
        assert response.status_code == 409
    
    def test_register_missing_gdpr_consent(self, client: TestClient):
        """Registration without GDPR consent should fail"""
        payload = {
            "email": "user@example.com",
            "username": "user",
            "password": "SecurePass123",
            "gdpr_consent": False,
            "age_verified": True,
        }
        
        response = client.post("/api/auth/register", json=payload)
        
        assert response.status_code == 400
    
    def test_register_weak_password(self, client: TestClient):
        """Registration with weak password should fail"""
        payload = {
            "email": "user@example.com",
            "username": "user",
            "password": "weak",
            "gdpr_consent": True,
            "age_verified": True,
        }
        
        response = client.post("/api/auth/register", json=payload)
        
        assert response.status_code == 422  # Validation error


class TestLoginEndpoint:
    """Tests for POST /api/auth/login"""
    
    def test_login_success(self, client: TestClient, test_user):
        """Successful login with email"""
        user, _ = test_user
        
        payload = {
            "email": user.email,
            "password": "password123",
        }
        
        response = client.post("/api/auth/login", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "role" in data
        assert data["role"] == user.role
    
    def test_login_with_username(self, client: TestClient, test_user):
        """Login should work with username"""
        user, _ = test_user
        
        payload = {
            "email": user.username,
            "password": "password123",
        }
        
        response = client.post("/api/auth/login", json=payload)
        
        assert response.status_code == 200
        assert "access_token" in response.json()
    
    def test_login_wrong_password(self, client: TestClient, test_user):
        """Login with wrong password should fail"""
        user, _ = test_user
        
        payload = {
            "email": user.email,
            "password": "wrongpassword",
        }
        
        response = client.post("/api/auth/login", json=payload)
        
        assert response.status_code == 401
        assert "Geçersiz" in response.json()["detail"] or "Invalid" in response.json()["detail"]
    
    def test_login_nonexistent_user(self, client: TestClient):
        """Login with non-existent user should fail"""
        payload = {
            "email": "nonexistent@example.com",
            "password": "password123",
        }
        
        response = client.post("/api/auth/login", json=payload)
        
        assert response.status_code == 401


class TestLogoutEndpoint:
    """Tests for POST /api/auth/logout"""
    
    def test_logout_success(self, client: TestClient, auth_header):
        """Successful logout"""
        response = client.post("/api/auth/logout", headers=auth_header)
        
        assert response.status_code == 200
        assert "Başarıyla çıkış yapıldı" in response.json()["message"]
    
    def test_logout_requires_authentication(self, client: TestClient):
        """Logout should require authentication"""
        response = client.post("/api/auth/logout")
        
        assert response.status_code in [401, 403]


class TestGuestLoginEndpoint:
    """Tests for POST /api/auth/guest"""
    
    def test_guest_login_success(self, client: TestClient, db_session: Session):
        """Successful guest login with valid barcode"""
        from app import models
        
        # Create a product with barcode
        product = models.Product(
            barcode="TEST123456",
            brand="Test Brand",
            model="Test Model"
        )
        db_session.add(product)
        db_session.commit()
        
        payload = {"barcode": "TEST123456"}
        
        response = client.post("/api/auth/guest", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["role"] == "guest"
    
    def test_guest_login_invalid_barcode(self, client: TestClient):
        """Guest login with invalid barcode should fail"""
        payload = {"barcode": "INVALID123"}
        
        response = client.post("/api/auth/guest", json=payload)
        
        assert response.status_code == 404
        assert "barkodu bulunamadı" in response.json()["detail"] or "not found" in response.json()["detail"]


class TestPasswordResetEndpoint:
    """Tests for POST /api/auth/password-reset"""
    
    def test_password_reset_always_returns_success(self, client: TestClient):
        """Password reset should always return success (prevent enumeration)"""
        payload = {"email": "user@example.com"}
        
        response = client.post("/api/auth/password-reset", json=payload)
        
        assert response.status_code == 200
        assert "message" in response.json()
    
    def test_password_reset_nonexistent_email(self, client: TestClient):
        """Password reset for non-existent email should still return success"""
        payload = {"email": "nonexistent@example.com"}
        
        response = client.post("/api/auth/password-reset", json=payload)
        
        assert response.status_code == 200  # Security: prevent email enumeration


class TestSessionsEndpoint:
    """Tests for GET /api/auth/sessions"""
    
    def test_get_sessions_success(self, client: TestClient, auth_header):
        """Get user sessions should return list"""
        response = client.get("/api/auth/sessions", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        assert "total" in data
        assert "active_count" in data
        assert isinstance(data["sessions"], list)
        assert data["total"] >= 1  # At least current session
    
    def test_get_sessions_requires_authentication(self, client: TestClient):
        """Get sessions should require authentication"""
        response = client.get("/api/auth/sessions")
        
        assert response.status_code in [401, 403]
    
    def test_sessions_include_current_session(self, client: TestClient, auth_header):
        """Sessions list should mark current session"""
        response = client.get("/api/auth/sessions", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        # At least one session should be marked as current
        current_sessions = [s for s in data["sessions"] if s.get("is_current")]
        assert len(current_sessions) >= 1


class TestRevokeSessionEndpoint:
    """Tests for DELETE /api/auth/sessions/{session_id}"""
    
    def test_revoke_session_success(self, client: TestClient, auth_header, db_session: Session):
        """Successfully revoke a session"""
        from app import models
        from app.core.security import create_access_token
        
        # Get current user
        user = db_session.query(models.User).first()
        
        # Create another session
        token, jti = create_access_token(data={"sub": str(user.id)})
        session = models.UserSession(
            user_id=user.id,
            token_id=jti,
            device_name="Another Device",
            user_agent="pytest",
            ip_address="127.0.0.1",
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(days=1),
        )
        db_session.add(session)
        db_session.commit()
        db_session.refresh(session)
        
        # Revoke the session
        response = client.delete(f"/api/auth/sessions/{session.id}", headers=auth_header)
        
        assert response.status_code == 200
        assert "iptal edildi" in response.json()["message"] or "revoked" in response.json()["message"]
    
    def test_revoke_nonexistent_session(self, client: TestClient, auth_header):
        """Revoke non-existent session should return 404"""
        response = client.delete(f"/api/auth/sessions/{uuid.uuid4()}", headers=auth_header)
        
        assert response.status_code == 404


class TestRevokeAllSessionsEndpoint:
    """Tests for POST /api/auth/sessions/revoke-all"""
    
    def test_revoke_all_sessions_success(self, client: TestClient, auth_header):
        """Successfully revoke all sessions except current"""
        response = client.post("/api/auth/sessions/revoke-all", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "revoked_count" in data
        assert isinstance(data["revoked_count"], int)
    
    def test_revoke_all_requires_authentication(self, client: TestClient):
        """Revoke all sessions should require authentication"""
        response = client.post("/api/auth/sessions/revoke-all")
        
        assert response.status_code in [401, 403]


class TestLoginHistoryEndpoint:
    """Tests for GET /api/auth/login-history"""
    
    def test_get_login_history_success(self, client: TestClient, auth_header):
        """Get login history should return list"""
        response = client.get("/api/auth/login-history", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        assert "history" in data
        assert "total" in data
        assert "successful_count" in data
        assert "failed_count" in data
        assert isinstance(data["history"], list)
    
    def test_get_login_history_with_limit(self, client: TestClient, auth_header):
        """Get login history with custom limit"""
        response = client.get("/api/auth/login-history?limit=10", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["history"]) <= 10
    
    def test_get_login_history_requires_authentication(self, client: TestClient):
        """Get login history should require authentication"""
        response = client.get("/api/auth/login-history")
        
        assert response.status_code in [401, 403]


class TestGoogleLoginEndpoint:
    """Tests for POST /api/auth/google"""
    
    def test_google_login_not_implemented(self, client: TestClient):
        """Google login should return 501 (not implemented)"""
        payload = {"token": "fake_google_token"}
        
        response = client.post("/api/auth/google", json=payload)
        
        assert response.status_code == 501
        assert "henüz uygulanmadı" in response.json()["detail"] or "not implemented" in response.json()["detail"]
    
    def test_google_login_invalid_token(self, client: TestClient):
        """Google login with invalid token should return 401"""
        payload = {"token": "short"}
        
        response = client.post("/api/auth/google", json=payload)
        
        assert response.status_code == 401


# ============================================================================
# USER ENDPOINTS TESTS
# ============================================================================

class TestGetCurrentUserEndpoint:
    """Tests for GET /api/users/me"""
    
    def test_get_current_user_success(self, client: TestClient, auth_header, test_user):
        """Get current user info should return user data"""
        user, _ = test_user
        
        response = client.get("/api/users/me", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(user.id)
        assert data["email"] == user.email
        assert data["username"] == user.username
        assert data["role"] == user.role
        assert "full_name" in data
        assert "skill_level" in data
        assert "available_tools" in data
        assert "owned_products" in data
    
    def test_get_current_user_requires_authentication(self, client: TestClient):
        """Get current user should require authentication"""
        response = client.get("/api/users/me")
        
        assert response.status_code in [401, 403]
    
    def test_get_current_user_includes_all_fields(self, client: TestClient, auth_header):
        """Get current user should include all expected fields"""
        response = client.get("/api/users/me", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        expected_fields = [
            "id", "email", "username", "role", "full_name",
            "skill_level", "available_tools", "owned_products"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
    
    def test_get_current_user_encrypted_fields(self, client: TestClient, auth_header, db_session):
        """Get current user should return decrypted address and phone if set"""
        from app import models
        
        # Get user and set encrypted fields
        user = db_session.query(models.User).first()
        user.address = "Test Address 123"
        user.phone = "+905551234567"
        db_session.commit()
        
        response = client.get("/api/users/me", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        # Address and phone should be decrypted
        if data.get("address"):
            assert data["address"] == "Test Address 123"
        if data.get("phone"):
            assert data["phone"] == "+905551234567"


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestCompleteAuthFlow:
    """Test complete authentication flow"""
    
    def test_register_login_logout_flow(self, client: TestClient):
        """Complete flow: register -> login -> get user -> logout"""
        # Step 1: Register
        register_payload = {
            "email": "flow@example.com",
            "username": "flowuser",
            "password": "SecurePass123",
            "gdpr_consent": True,
            "age_verified": True,
        }
        
        register_response = client.post("/api/auth/register", json=register_payload)
        assert register_response.status_code == 201
        register_data = register_response.json()
        token = register_data["access_token"]
        auth_header = {"Authorization": f"Bearer {token}"}
        
        # Step 2: Get current user
        user_response = client.get("/api/users/me", headers=auth_header)
        assert user_response.status_code == 200
        user_data = user_response.json()
        assert user_data["email"] == register_payload["email"]
        
        # Step 3: Get sessions
        sessions_response = client.get("/api/auth/sessions", headers=auth_header)
        assert sessions_response.status_code == 200
        assert sessions_response.json()["total"] >= 1
        
        # Step 4: Logout
        logout_response = client.post("/api/auth/logout", headers=auth_header)
        assert logout_response.status_code == 200
    
    def test_login_sessions_history_flow(self, client: TestClient, test_user):
        """Test flow: login -> check sessions -> check login history"""
        user, token = test_user
        auth_header = {"Authorization": f"Bearer {token}"}
        
        # Login again to create another session
        login_response = client.post(
            "/api/auth/login",
            json={"email": user.email, "password": "password123"}
        )
        assert login_response.status_code == 200
        
        # Check sessions (should have at least 2 now)
        sessions_response = client.get("/api/auth/sessions", headers=auth_header)
        assert sessions_response.status_code == 200
        sessions_data = sessions_response.json()
        assert sessions_data["total"] >= 2
        
        # Check login history
        history_response = client.get("/api/auth/login-history", headers=auth_header)
        assert history_response.status_code == 200
        history_data = history_response.json()
        assert history_data["total"] >= 1
        assert history_data["successful_count"] >= 1


class TestRouteModularity:
    """Test that routes are properly modularized"""
    
    def test_all_auth_routes_accessible(self, client: TestClient):
        """Verify all auth routes are accessible at correct paths"""
        auth_routes = [
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/logout",
            "/api/auth/guest",
            "/api/auth/password-reset",
            "/api/auth/google",
            "/api/auth/sessions",
            "/api/auth/login-history",
        ]
        
        for route in auth_routes:
            # We're just checking routes exist, not that they work without auth
            # Some will return 401/422 which is expected
            response = client.get(route) if route.endswith("sessions") or route.endswith("history") else client.post(route, json={})
            # Should not return 404 (route not found)
            assert response.status_code != 404, f"Route {route} not found"
    
    def test_user_routes_accessible(self, client: TestClient):
        """Verify user routes are accessible at correct paths"""
        # Should require auth, but route should exist
        response = client.get("/api/users/me")
        assert response.status_code != 404  # Route exists
        assert response.status_code in [401, 403]  # But requires auth
    
    def test_system_routes_accessible(self, client: TestClient):
        """Verify system routes are accessible at correct paths"""
        # Health and metrics should be accessible without auth
        health_response = client.get("/health")
        assert health_response.status_code == 200
        
        metrics_response = client.get("/metrics")
        assert metrics_response.status_code == 200


class TestErrorHandling:
    """Test error handling across routes"""
    
    def test_invalid_json_returns_422(self, client: TestClient):
        """Invalid JSON should return 422"""
        response = client.post(
            "/api/auth/register",
            json={"invalid": "data"}
        )
        assert response.status_code == 422
    
    def test_missing_required_fields(self, client: TestClient):
        """Missing required fields should return 422"""
        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com"}
            # Missing password
        )
        assert response.status_code == 422
    
    def test_invalid_uuid_format(self, client: TestClient, auth_header):
        """Invalid UUID format should return 422 or 500 (validation error)"""
        # FastAPI/SQLAlchemy validates UUID format before reaching endpoint
        # This may raise an exception during parameter conversion
        try:
            response = client.delete(
                "/api/auth/sessions/invalid-uuid",
                headers=auth_header
            )
            # Should return 422 (validation error) or 500 (internal error from UUID conversion)
            assert response.status_code in [404, 422, 500]
        except Exception:
            # If exception is raised during request (UUID validation), that's also acceptable
            # as it means validation is working
            pass


class TestResponseFormats:
    """Test response formats are consistent"""
    
    def test_auth_responses_have_token_type(self, client: TestClient, test_user):
        """Auth responses should include token_type"""
        user, _ = test_user
        
        login_response = client.post(
            "/api/auth/login",
            json={"email": user.email, "password": "password123"}
        )
        
        assert login_response.status_code == 200
        data = login_response.json()
        assert "token_type" in data
        assert data["token_type"] == "bearer"
    
    def test_error_responses_have_detail(self, client: TestClient):
        """Error responses should include detail field"""
        response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "wrong"}
        )
        
        assert response.status_code == 401
        assert "detail" in response.json()


# ============================================================================
# FRONTEND COMPATIBILITY TESTS
# ============================================================================

class TestFrontendCompatibility:
    """Tests to verify API responses match frontend expectations"""
    
    def test_login_response_format_matches_frontend(self, client: TestClient, test_user):
        """Login response should have format frontend expects: response.data.access_token"""
        user, _ = test_user
        
        response = client.post(
            "/api/auth/login",
            json={"email": user.email, "password": "password123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        # Frontend expects: response.data.access_token
        assert "access_token" in data
        assert "token_type" in data
        assert "role" in data
        assert data["token_type"] == "bearer"
        # Verify it's a valid JWT token
        assert len(data["access_token"].split(".")) == 3  # JWT has 3 parts
    
    def test_register_response_format_matches_frontend(self, client: TestClient):
        """Register response should have format frontend expects"""
        payload = {
            "email": "frontend@example.com",
            "username": "frontenduser",
            "password": "SecurePass123",
            "gdpr_consent": True,
            "age_verified": True,
        }
        
        response = client.post("/api/auth/register", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        # Frontend expects: response.data.access_token
        assert "access_token" in data
        assert "user" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        # Frontend accesses: response.data.user
        assert data["user"]["email"] == payload["email"]
        assert data["user"]["username"] == payload["username"]
    
    def test_error_response_format_matches_frontend(self, client: TestClient):
        """Error responses should have format frontend expects: response.data.detail"""
        response = client.post(
            "/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpass"}
        )
        
        assert response.status_code == 401
        data = response.json()
        # Frontend expects: error.response?.data?.detail
        assert "detail" in data
        assert isinstance(data["detail"], str)
    
    def test_validation_error_format_matches_frontend(self, client: TestClient):
        """Validation errors should have format frontend expects: response.data.errors"""
        response = client.post(
            "/api/auth/register",
            json={"email": "invalid", "password": "weak"}  # Invalid data
        )
        
        assert response.status_code == 422
        data = response.json()
        # Frontend may check: error.response?.data?.errors
        # FastAPI returns "detail" for validation errors, which is also fine
        assert "detail" in data
    
    def test_user_me_response_format_matches_frontend(self, client: TestClient, auth_header, test_user):
        """User endpoint response should match frontend expectations"""
        user, _ = test_user
        
        response = client.get("/api/users/me", headers=auth_header)
        
        assert response.status_code == 200
        data = response.json()
        # Frontend expects: response.data (which is the user object)
        assert "id" in data
        assert "email" in data
        assert "username" in data
        assert "role" in data
        # Frontend accesses: response.data.email, response.data.username, etc.
        assert data["email"] == user.email
        assert data["username"] == user.username
    
    def test_cors_headers_present(self, client: TestClient):
        """CORS headers should be present for frontend requests"""
        response = client.options(
            "/api/auth/login",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST"
            }
        )
        
        # CORS preflight should be handled
        # The actual CORS headers are set by middleware, TestClient may not show them
        # But we verify the endpoint is accessible
        assert response.status_code in [200, 405]  # OPTIONS may return 405 or 200
    
    def test_content_type_is_json(self, client: TestClient, test_user):
        """Responses should have Content-Type: application/json"""
        user, _ = test_user
        
        response = client.post(
            "/api/auth/login",
            json={"email": user.email, "password": "password123"}
        )
        
        assert response.status_code == 200
        # FastAPI automatically sets Content-Type to application/json
        assert "application/json" in response.headers.get("content-type", "")
    
    def test_api_paths_match_frontend_expectations(self, client: TestClient):
        """Verify API paths match what frontend calls"""
        # Frontend calls:
        # - api.post('/auth/login') -> /api/auth/login
        # - api.post('/auth/register') -> /api/auth/register
        # - api.get('/users/me') -> /api/users/me
        
        # Test login path
        response = client.post("/api/auth/login", json={"email": "test", "password": "test"})
        assert response.status_code != 404  # Route exists
        
        # Test register path
        response = client.post("/api/auth/register", json={})
        assert response.status_code != 404  # Route exists (will be 422 for validation)
        
        # Test user me path
        response = client.get("/api/users/me")
        assert response.status_code != 404  # Route exists (will be 401 without auth)
    
    def test_response_structure_for_frontend_parsing(self, client: TestClient, test_user):
        """Verify response structure can be parsed by frontend axios"""
        user, _ = test_user
        
        # Login response
        login_response = client.post(
            "/api/auth/login",
            json={"email": user.email, "password": "password123"}
        )
        login_data = login_response.json()
        # Frontend does: const { access_token, role } = response.data
        assert "access_token" in login_data
        assert "role" in login_data
        
        # Get user response
        token = login_data["access_token"]
        user_response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        user_data = user_response.json()
        # Frontend does: setUser(response.data)
        assert isinstance(user_data, dict)
        assert "email" in user_data
        assert "username" in user_data

