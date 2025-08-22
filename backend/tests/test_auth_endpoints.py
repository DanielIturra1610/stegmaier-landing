"""
Authentication Endpoints Tests
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from app.main import app

client = TestClient(app)

class TestAuthEndpoints:
    """Test suite for authentication endpoints"""

    def test_register_user_success(self):
        """Test successful user registration"""
        user_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test User"
        }
        
        with patch('app.application.services.auth_service.AuthService.register') as mock_register:
            mock_register.return_value = {
                "id": "user123",
                "email": "test@example.com",
                "name": "Test User",
                "role": "student",
                "created_at": "2024-01-01T00:00:00Z"
            }
            
            response = client.post("/api/v1/auth/register", json=user_data)
            
            assert response.status_code == 201
            data = response.json()
            assert data["email"] == "test@example.com"
            assert data["name"] == "Test User"
            assert data["role"] == "student"
            assert "id" in data
            mock_register.assert_called_once()

    def test_register_user_duplicate_email(self):
        """Test registration with duplicate email"""
        user_data = {
            "email": "existing@example.com",
            "password": "testpassword123",
            "name": "Test User"
        }
        
        with patch('app.application.services.auth_service.AuthService.register') as mock_register:
            mock_register.side_effect = ValueError("Email already registered")
            
            response = client.post("/api/v1/auth/register", json=user_data)
            
            assert response.status_code == 400
            assert "Email already registered" in response.json()["detail"]

    def test_register_user_invalid_email(self):
        """Test registration with invalid email format"""
        user_data = {
            "email": "invalid-email",
            "password": "testpassword123",
            "name": "Test User"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 422
        assert "validation error" in response.json()["detail"].lower()

    def test_login_success(self):
        """Test successful login"""
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        
        with patch('app.application.services.auth_service.AuthService.login') as mock_login:
            mock_login.return_value = {
                "access_token": "mock-jwt-token",
                "token_type": "bearer",
                "user": {
                    "id": "user123",
                    "email": "test@example.com",
                    "name": "Test User",
                    "role": "student"
                }
            }
            
            response = client.post("/api/v1/auth/login", json=login_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["access_token"] == "mock-jwt-token"
            assert data["token_type"] == "bearer"
            assert data["user"]["email"] == "test@example.com"
            mock_login.assert_called_once_with("test@example.com", "testpassword123")

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        
        with patch('app.application.services.auth_service.AuthService.login') as mock_login:
            mock_login.side_effect = ValueError("Invalid credentials")
            
            response = client.post("/api/v1/auth/login", json=login_data)
            
            assert response.status_code == 401
            assert "Invalid credentials" in response.json()["detail"]

    def test_login_missing_fields(self):
        """Test login with missing required fields"""
        login_data = {
            "email": "test@example.com"
            # Missing password
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 422

    def test_get_current_user_authenticated(self):
        """Test getting current user with valid token"""
        with patch('app.api.v1.deps.get_current_user') as mock_get_user:
            mock_get_user.return_value = {
                "id": "user123",
                "email": "test@example.com",
                "name": "Test User",
                "role": "student"
            }
            
            response = client.get(
                "/api/v1/auth/me",
                headers={"Authorization": "Bearer mock-jwt-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == "test@example.com"
            assert data["name"] == "Test User"

    def test_get_current_user_unauthorized(self):
        """Test getting current user without token"""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

    def test_get_current_user_invalid_token(self):
        """Test getting current user with invalid token"""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token"}
        )
        
        assert response.status_code == 401

    def test_logout_success(self):
        """Test successful logout"""
        with patch('app.api.v1.deps.get_current_user') as mock_get_user:
            mock_get_user.return_value = {
                "id": "user123",
                "email": "test@example.com"
            }
            
            response = client.post(
                "/api/v1/auth/logout",
                headers={"Authorization": "Bearer mock-jwt-token"}
            )
            
            assert response.status_code == 200
            assert response.json()["message"] == "Successfully logged out"

    def test_refresh_token_success(self):
        """Test successful token refresh"""
        with patch('app.application.services.auth_service.AuthService.refresh_token') as mock_refresh:
            mock_refresh.return_value = {
                "access_token": "new-jwt-token",
                "token_type": "bearer"
            }
            
            response = client.post(
                "/api/v1/auth/refresh",
                headers={"Authorization": "Bearer old-jwt-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["access_token"] == "new-jwt-token"
            assert data["token_type"] == "bearer"

    def test_change_password_success(self):
        """Test successful password change"""
        password_data = {
            "current_password": "oldpassword123",
            "new_password": "newpassword123"
        }
        
        with patch('app.api.v1.deps.get_current_user') as mock_get_user:
            with patch('app.application.services.auth_service.AuthService.change_password') as mock_change:
                mock_get_user.return_value = {"id": "user123"}
                mock_change.return_value = True
                
                response = client.put(
                    "/api/v1/auth/change-password",
                    json=password_data,
                    headers={"Authorization": "Bearer mock-jwt-token"}
                )
                
                assert response.status_code == 200
                assert response.json()["message"] == "Password updated successfully"

    def test_change_password_wrong_current(self):
        """Test password change with wrong current password"""
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword123"
        }
        
        with patch('app.api.v1.deps.get_current_user') as mock_get_user:
            with patch('app.application.services.auth_service.AuthService.change_password') as mock_change:
                mock_get_user.return_value = {"id": "user123"}
                mock_change.side_effect = ValueError("Current password is incorrect")
                
                response = client.put(
                    "/api/v1/auth/change-password",
                    json=password_data,
                    headers={"Authorization": "Bearer mock-jwt-token"}
                )
                
                assert response.status_code == 400
                assert "Current password is incorrect" in response.json()["detail"]
