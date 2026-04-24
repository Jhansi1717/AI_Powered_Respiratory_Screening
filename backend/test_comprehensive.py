#!/usr/bin/env python
"""Comprehensive test script for authentication endpoints"""

import sys
import os
sys.path.insert(0, os.getcwd())

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, DATABASE_PATH

# Clean up old database file
if DATABASE_PATH.exists():
    try:
        DATABASE_PATH.unlink()
    except OSError:
        pass

# Create tables
Base.metadata.create_all(bind=engine)

with TestClient(app) as client:
    print("=" * 60)
    print("TESTING AUTHENTICATION ENDPOINTS")
    print("=" * 60)

    # Test 1: Signup
    print("\n✓ Test 1: User Signup")
    signup_response = client.post(
        "/api/signup",
        json={"email": "john@example.com", "password": "SecurePass123"}
    )
    print(f"  Status: {signup_response.status_code}")
    print(f"  Response: {signup_response.json()}")
    assert signup_response.status_code == 200
    assert signup_response.json()["email"] == "john@example.com"

    # Test 2: Login
    print("\n✓ Test 2: User Login")
    login_response = client.post(
        "/api/login",
        json={"email": "john@example.com", "password": "SecurePass123"}
    )
    print(f"  Status: {login_response.status_code}")
    login_data = login_response.json()
    print(f"  Token type: {login_data.get('token_type')}")
    print(f"  Token length: {len(login_data.get('access_token', ''))}")
    assert login_response.status_code == 200
    assert login_data["token_type"] == "bearer"
    assert "access_token" in login_data

    token = login_data["access_token"]

    # Test 3: Protected route with token
    print("\n✓ Test 3: Protected Route with Token")
    history_response = client.get(
        "/api/history",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"  Status: {history_response.status_code}")
    print(f"  Response: {history_response.json()}")
    assert history_response.status_code == 200

    # Test 4: Wrong password
    print("\n✓ Test 4: Login with Wrong Password")
    wrong_pwd = client.post(
        "/api/login",
        json={"email": "john@example.com", "password": "WrongPassword"}
    )
    print(f"  Status: {wrong_pwd.status_code}")
    assert wrong_pwd.status_code == 401

    # Test 5: Duplicate email
    print("\n✓ Test 5: Signup with Duplicate Email")
    duplicate = client.post(
        "/api/signup",
        json={"email": "john@example.com", "password": "AnotherPass123"}
    )
    print(f"  Status: {duplicate.status_code}")
    assert duplicate.status_code == 400

    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
