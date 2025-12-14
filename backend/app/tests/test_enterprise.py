"""
Tests for enterprise functionality
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestEnterpriseRegistration:
    """Tests for enterprise registration"""
    
    def test_register_enterprise_user_creates_all_entities(self, client: TestClient):
        """Enterprise registration should create enterprise, branch, and user"""
        payload = {
            "email": "tech@company.com",
            "username": "techuser",
            "password": "SecurePass123",
            "full_name": "Tech User",
            "phone": "555-1234",
            "enterprise_name": "Test Company",
            "enterprise_registration_number": "12345678",
            "enterprise_contact_email": "contact@company.com",
            "enterprise_contact_phone": "555-0000",
            "branch_name": "Istanbul Branch",
            "branch_address": "Istanbul, Turkey",
            "branch_phone": "555-1111",
            "employee_id": "EMP001",
            "enterprise_role": "technician",
            "specialization": ["Washing Machine", "Refrigerator"],
            "gdpr_consent": True,
            "age_verified": True
        }
        
        response = client.post("/api/enterprise/register", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert "enterprise" in data
        assert "branch" in data
        assert data["user"]["enterprise_role"] == "technician"
        assert data["enterprise"]["name"] == "Test Company"
        assert data["branch"]["name"] == "Istanbul Branch"
    
    def test_register_branch_manager_sets_as_manager(self, client: TestClient):
        """Branch manager registration should set them as branch manager"""
        payload = {
            "email": "manager@company.com",
            "username": "branchmanager",
            "password": "SecurePass123",
            "full_name": "Branch Manager",
            "enterprise_name": "Test Company 2",
            "enterprise_contact_email": "contact@company2.com",
            "branch_name": "Ankara Branch",
            "enterprise_role": "branch_manager",
            "gdpr_consent": True,
            "age_verified": True
        }
        
        response = client.post("/api/enterprise/register", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["enterprise_role"] == "branch_manager"
        # Branch manager_id should be set to the user
        assert data["branch"]["manager_id"] == data["user"]["id"]
    
    def test_invalid_enterprise_role_fails(self, client: TestClient):
        """Invalid enterprise role should fail validation"""
        payload = {
            "email": "test@company.com",
            "username": "testuser",
            "password": "SecurePass123",
            "full_name": "Test User",
            "enterprise_name": "Test Company",
            "enterprise_contact_email": "contact@company.com",
            "branch_name": "Test Branch",
            "enterprise_role": "invalid_role",
            "gdpr_consent": True,
            "age_verified": True
        }
        
        response = client.post("/api/enterprise/register", json=payload)
        
        assert response.status_code == 422  # Validation error
    
    def test_duplicate_email_fails(self, client: TestClient, test_user):
        """Duplicate email should fail"""
        user, _ = test_user
        
        payload = {
            "email": user.email,  # Duplicate email
            "username": "newuser",
            "password": "SecurePass123",
            "full_name": "New User",
            "enterprise_name": "Company",
            "enterprise_contact_email": "contact@company.com",
            "branch_name": "Branch",
            "enterprise_role": "technician",
            "gdpr_consent": True,
            "age_verified": True
        }
        
        response = client.post("/api/enterprise/register", json=payload)
        
        assert response.status_code == 400
        assert "zaten kullanılıyor" in response.json()["detail"]


class TestEnterpriseDashboard:
    """Tests for enterprise dashboard"""
    
    def test_enterprise_user_can_access_dashboard(self, client: TestClient, db_session):
        """Enterprise user can access dashboard"""
        # Create enterprise user
        from app.tests.conftest import _create_user_with_session
        from app.models import Enterprise, Branch
        
        # Create enterprise and branch
        enterprise = Enterprise(
            name="Test Enterprise",
            contact_email="contact@test.com"
        )
        db_session.add(enterprise)
        db_session.commit()
        
        branch = Branch(
            enterprise_id=enterprise.id,
            name="Test Branch"
        )
        db_session.add(branch)
        db_session.commit()
        
        # Create user with enterprise
        user, token = _create_user_with_session(
            db_session,
            email="ent@test.com",
            username="entuser"
        )
        user.enterprise_id = enterprise.id
        user.branch_id = branch.id
        user.enterprise_role = "technician"
        db_session.commit()
        
        response = client.get(
            "/api/enterprise/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data
        assert "enterprise" in data
        assert data["enterprise"]["name"] == "Test Enterprise"
    
    def test_non_enterprise_user_cannot_access_dashboard(self, client: TestClient, auth_header):
        """Non-enterprise users should be blocked from dashboard"""
        response = client.get(
            "/api/enterprise/dashboard",
            headers=auth_header
        )
        
        assert response.status_code == 403
        assert "Enterprise access required" in response.json()["detail"]


class TestEnterpriseRBAC:
    """Tests for Role-Based Access Control"""
    
    def test_enterprise_admin_can_access_branches(self, client: TestClient, db_session):
        """Enterprise admins can access branches endpoint"""
        from app.tests.conftest import _create_user_with_session
        from app.models import Enterprise, Branch
        
        # Create enterprise
        enterprise = Enterprise(name="RBAC Test", contact_email="rbac@test.com")
        db_session.add(enterprise)
        db_session.commit()
        
        # Create branch
        branch = Branch(enterprise_id=enterprise.id, name="Main Branch")
        db_session.add(branch)
        db_session.commit()
        
        # Create enterprise admin
        user, token = _create_user_with_session(
            db_session,
            email="admin@rbac.com",
            username="rbacadmin"
        )
        user.enterprise_id = enterprise.id
        user.enterprise_role = "enterprise_admin"
        db_session.commit()
        
        response = client.get(
            "/api/enterprise/branches",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        branches = response.json()
        assert len(branches) == 1
        assert branches[0]["name"] == "Main Branch"
    
    def test_branch_manager_cannot_access_branches_endpoint(self, client: TestClient, db_session):
        """Branch managers should not access enterprise-wide branches endpoint"""
        from app.tests.conftest import _create_user_with_session
        from app.models import Enterprise, Branch
        
        # Create enterprise
        enterprise = Enterprise(name="RBAC Test 2", contact_email="rbac2@test.com")
        db_session.add(enterprise)
        db_session.commit()
        
        # Create branch
        branch = Branch(enterprise_id=enterprise.id, name="Test Branch")
        db_session.add(branch)
        db_session.commit()
        
        # Create branch manager
        user, token = _create_user_with_session(
            db_session,
            email="manager@rbac.com",
            username="branchmanager"
        )
        user.enterprise_id = enterprise.id
        user.branch_id = branch.id
        user.enterprise_role = "branch_manager"
        db_session.commit()
        
        response = client.get(
            "/api/enterprise/branches",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 403


class TestEmployeeManagement:
    """Tests for employee management endpoints"""
    
    def test_branch_manager_can_view_employees(self, client: TestClient, db_session):
        """Branch managers can view their branch employees"""
        from app.tests.conftest import _create_user_with_session
        from app.models import Enterprise, Branch
        
        # Create enterprise and branch
        enterprise = Enterprise(name="Employee Test", contact_email="emp@test.com")
        db_session.add(enterprise)
        db_session.commit()
        
        branch = Branch(enterprise_id=enterprise.id, name="Employee Branch")
        db_session.add(branch)
        db_session.commit()
        
        # Create branch manager
        manager, token = _create_user_with_session(
            db_session,
            email="manager@emp.com",
            username="empmanager"
        )
        manager.enterprise_id = enterprise.id
        manager.branch_id = branch.id
        manager.enterprise_role = "branch_manager"
        db_session.commit()
        
        # Create employee in same branch
        employee, _ = _create_user_with_session(
            db_session,
            email="emp@emp.com",
            username="employee"
        )
        employee.enterprise_id = enterprise.id
        employee.branch_id = branch.id
        employee.enterprise_role = "technician"
        db_session.commit()
        
        response = client.get(
            "/api/enterprise/employees",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2  # Manager + employee
        assert len(data["employees"]) == 2


class TestEnterpriseUserResponse:
    """Tests for enterprise user data in responses"""
    
    def test_login_response_includes_enterprise_fields(self, client: TestClient, db_session):
        """Login response should include enterprise_id and enterprise_role"""
        from app.tests.conftest import _create_user_with_session
        from app.models import Enterprise, Branch
        
        # Create enterprise
        enterprise = Enterprise(name="Login Test", contact_email="login@test.com")
        db_session.add(enterprise)
        db_session.commit()
        
        # Create branch
        branch = Branch(enterprise_id=enterprise.id, name="Login Branch")
        db_session.add(branch)
        db_session.commit()
        
        # Create user
        user, _ = _create_user_with_session(
            db_session,
            email="login@enterprise.com",
            username="loginuser"
        )
        user.enterprise_id = enterprise.id
        user.branch_id = branch.id
        user.enterprise_role = "senior_technician"
        db_session.commit()
        
        response = client.post(
            "/api/auth/login",
            json={"email": "login@enterprise.com", "password": "password123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "enterprise_id" in data
        assert "enterprise_role" in data
        assert data["enterprise_role"] == "senior_technician"
        assert data["enterprise_id"] is not None

