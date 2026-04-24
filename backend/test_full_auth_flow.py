#!/usr/bin/env python3
"""
Comprehensive authentication flow test
Tests the complete signup -> login -> protected routes flow
"""

import requests
import time
import os

def test_full_auth_flow():
    print("🔐 Testing Full Authentication Flow")
    print("=" * 50)

    base_url = "http://127.0.0.1:8000"

    # Test 1: Signup
    print("\n1. Testing User Signup...")
    unique_email = f"testuser{int(time.time())}@example.com"
    signup_data = {
        "email": unique_email,
        "password": "testpass123"
    }

    try:
        response = requests.post(f"{base_url}/api/signup", json=signup_data)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            user_data = response.json()
            print(f"   ✅ User created: ID {user_data['id']}, Email: {user_data['email']}")
            user_id = user_data['id']
        else:
            print(f"   ❌ Signup failed: {response.text}")
            return False

    except Exception as e:
        print(f"   ❌ Signup error: {e}")
        return False

    # Test 2: Login
    print("\n2. Testing User Login...")
    login_data = {
        "email": unique_email,
        "password": "testpass123"
    }

    try:
        response = requests.post(f"{base_url}/api/login", json=login_data)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            token_data = response.json()
            token = token_data['access_token']
            print(f"   ✅ Login successful, token received: {token[:30]}...")
        else:
            print(f"   ❌ Login failed: {response.text}")
            return False

    except Exception as e:
        print(f"   ❌ Login error: {e}")
        return False

    # Test 3: Protected History Route
    print("\n3. Testing Protected History Route...")
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(f"{base_url}/api/history", headers=headers)
        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            history_data = response.json()
            print(f"   ✅ History accessible, returned {len(history_data)} records")
        else:
            print(f"   ❌ History access failed: {response.text}")
            return False

    except Exception as e:
        print(f"   ❌ History error: {e}")
        return False

    # Test 4: Test Predict Route (requires file upload)
    print("\n4. Testing Protected Predict Route...")

    # Create a dummy audio file for testing (Windows compatible)
    test_audio_path = "test_audio.wav"
    try:
        # Create a minimal WAV file for testing
        with open(test_audio_path, 'wb') as f:
            # Minimal WAV header + some dummy data
            f.write(b'RIFF\x24\x08\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x01\x00\x08\x00data\x00\x08\x00\x00')
            f.write(b'\x00' * 2048)  # Add some dummy audio data

        with open(test_audio_path, 'rb') as f:
            files = {'file': ('test.wav', f, 'audio/wav')}
            response = requests.post(f"{base_url}/api/predict", files=files, headers=headers)

        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            predict_data = response.json()
            print(f"   ✅ Prediction successful: {predict_data.get('prediction', 'N/A')}")
        else:
            print(f"   ❌ Prediction failed: {response.text}")

        # Clean up test file
        if os.path.exists(test_audio_path):
            os.remove(test_audio_path)

    except Exception as e:
        print(f"   ❌ Prediction error: {e}")
        # Clean up test file even if error
        if os.path.exists(test_audio_path):
            os.remove(test_audio_path)

    # Test 5: Test without token (should fail)
    print("\n5. Testing Unauthorized Access...")
    try:
        response = requests.get(f"{base_url}/api/history")
        print(f"   Status: {response.status_code}")

        if response.status_code == 401:
            print("   ✅ Unauthorized access properly blocked")
        else:
            print(f"   ❌ Should have been blocked: {response.status_code}")

    except Exception as e:
        print(f"   ❌ Unauthorized access test error: {e}")

    print("\n" + "=" * 50)
    print("🎉 Authentication flow test completed!")
    return True

if __name__ == "__main__":
    test_full_auth_flow()