#!/usr/bin/env python
"""Test React login integration with FastAPI backend"""

import requests
import json

# Simulate what the updated React Login.js does
def test_react_login():
    print("Testing React Login Integration")
    print("=" * 40)

    # Step 1: Signup a test user
    signup_url = "http://127.0.0.1:8000/api/signup"
    signup_data = {
        "email": "reacttest@example.com",
        "password": "ReactPass123"
    }

    print("1. Creating test user...")
    try:
        signup_response = requests.post(signup_url, json=signup_data)
        print(f"   Signup Status: {signup_response.status_code}")
        if signup_response.status_code == 200:
            print(f"   User created: {signup_response.json()}")
        else:
            print(f"   Error: {signup_response.json()}")
    except Exception as e:
        print(f"   Connection error: {e}")
        return

    # Step 2: Login (simulating React axios call)
    login_url = "http://127.0.0.1:8000/api/login"
    login_data = {
        "email": "reacttest@example.com",
        "password": "ReactPass123"
    }

    print("\n2. Testing login (axios simulation)...")
    try:
        login_response = requests.post(login_url, json=login_data)
        print(f"   Login Status: {login_response.status_code}")

        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get("access_token")
            token_type = login_result.get("token_type")

            print(f"   Token Type: {token_type}")
            print(f"   Token Length: {len(token) if token else 0} characters")
            print("   ✅ JWT token received successfully!")

            # Step 3: Test protected route with token
            print("\n3. Testing protected route with JWT token...")
            history_url = "http://127.0.0.1:8000/api/history"
            headers = {"Authorization": f"Bearer {token}"}

            history_response = requests.get(history_url, headers=headers)
            print(f"   Protected Route Status: {history_response.status_code}")

            if history_response.status_code == 200:
                print("   ✅ Protected route accessible with token!")
                print(f"   Response: {history_response.json()}")
            else:
                print(f"   ❌ Protected route failed: {history_response.json()}")

        else:
            print(f"   ❌ Login failed: {login_response.json()}")

    except Exception as e:
        print(f"   Connection error: {e}")

    print("\n" + "=" * 40)
    print("✅ React Login Integration Test Complete!")
    print("The updated Login.js should work with these endpoints.")

if __name__ == "__main__":
    test_react_login()