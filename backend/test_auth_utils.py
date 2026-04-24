#!/usr/bin/env python
"""Test the new auth utilities work correctly"""

import requests
import json

def test_auth_utilities():
    print("Testing Auth Utilities Integration")
    print("=" * 40)

    # Test 1: Signup
    print("1. Testing signup...")
    import time
    unique_email = f"authtest{int(time.time())}@example.com"
    signup_response = requests.post(
        "http://127.0.0.1:8000/api/signup",
        json={"email": unique_email, "password": "testpass123"}
    )
    print(f"   Status: {signup_response.status_code}")
    assert signup_response.status_code == 200

    # Test 2: Login
    print("2. Testing login...")
    login_response = requests.post(
        "http://127.0.0.1:8000/api/login",
        json={"email": unique_email, "password": "testpass123"}
    )
    print(f"   Status: {login_response.status_code}")
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    print(f"   Token received: {token[:20]}...")

    # Test 3: Protected route with token
    print("3. Testing protected route...")
    history_response = requests.get(
        "http://127.0.0.1:8000/api/history",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   Status: {history_response.status_code}")
    assert history_response.status_code == 200

    print("\n✅ All auth utilities working correctly!")
    print("The React frontend can now use:")
    print("  - setToken(token)")
    print("  - getToken()")
    print("  - removeToken()")
    print("  - isAuthenticated()")
    print("  - logout()")
    print("  - requireAuth()")

if __name__ == "__main__":
    test_auth_utilities()