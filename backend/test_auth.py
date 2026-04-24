"""
Test file to verify FastAPI authentication endpoints
Run with: python -m pytest test_auth.py -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base
from app.api.deps import get_db
from app.models.user import User
from app.models.record import Record

# Use in-memory SQLite for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables
Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


class TestAuthentication:
    """Test authentication endpoints"""

    def test_root_endpoint(self):
        """Test that root endpoint returns message"""
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()

    def test_signup_new_user(self):
        """Test signup with new user"""
        response = client.post(
            "/api/signup",
            json={
                "email": "testuser@example.com",
                "password": "testpassword123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "testuser@example.com"
        assert "id" in data

    def test_signup_duplicate_email(self):
        """Test signup with duplicate email fails"""
        # First signup
        client.post(
            "/api/signup",
            json={
                "email": "duplicate@example.com",
                "password": "password123"
            }
        )
        
        # Second signup with same email
        response = client.post(
            "/api/signup",
            json={
                "email": "duplicate@example.com",
                "password": "different123"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_login_success(self):
        """Test successful login"""
        # First create a user
        client.post(
            "/api/signup",
            json={
                "email": "login@example.com",
                "password": "password123"
            }
        )
        
        # Then login
        response = client.post(
            "/api/login",
            json={
                "email": "login@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_oauth_token_success(self):
        """Test Swagger-compatible OAuth token login."""
        client.post(
            "/api/signup",
            json={
                "email": "oauth@example.com",
                "password": "password123"
            }
        )

        response = client.post(
            "/api/token",
            data={
                "username": "oauth@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

        history_response = client.get(
            "/api/history",
            headers={"Authorization": f"Bearer {data['access_token']}"}
        )
        assert history_response.status_code == 200

    def test_login_invalid_email(self):
        """Test login with non-existent email"""
        response = client.post(
            "/api/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    def test_login_wrong_password(self):
        """Test login with wrong password"""
        # Create user
        client.post(
            "/api/signup",
            json={
                "email": "wrongpwd@example.com",
                "password": "correctpassword"
            }
        )
        
        # Try login with wrong password
        response = client.post(
            "/api/login",
            json={
                "email": "wrongpwd@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    def test_protected_route_without_token(self):
        """Test accessing protected route without token"""
        response = client.get("/api/history")
        assert response.status_code == 401

    def test_protected_route_with_valid_token(self):
        """Test accessing protected route with valid token"""
        # Create user and login
        client.post(
            "/api/signup",
            json={
                "email": "protected@example.com",
                "password": "password123"
            }
        )
        
        login_response = client.post(
            "/api/login",
            json={
                "email": "protected@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Access protected route
        response = client.get(
            "/api/history",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200

    def test_protected_route_with_invalid_token(self):
        """Test accessing protected route with invalid token"""
        response = client.get(
            "/api/history",
            headers={"Authorization": "Bearer invalid_token_123"}
        )
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
