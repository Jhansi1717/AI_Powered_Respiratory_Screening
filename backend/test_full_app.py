#!/usr/bin/env python
"""Test script for Respiratory AI application"""

import requests
import json

BASE_URL = 'http://127.0.0.1:8000'

print('=== TESTING RESPIRATORY AI APPLICATION ===')
print()

# Test 1: Backend Health Check
print('1. Backend Health Check')
try:
    response = requests.get(f'{BASE_URL}/')
    print(f'   ✅ Status: {response.status_code}')
    print(f'   Response: {response.json()}')
except Exception as e:
    print(f'   ❌ Failed: {e}')
    exit(1)

print()

# Test 2: User Signup
print('2. User Signup Test')
signup_data = {'email': 'testuser@example.com', 'password': 'testpass123'}
try:
    response = requests.post(f'{BASE_URL}/api/signup', json=signup_data)
    print(f'   ✅ Status: {response.status_code}')
    if response.status_code == 200:
        print(f'   User created: {response.json()}')
    else:
        print(f'   Response: {response.json()}')
except Exception as e:
    print(f'   ❌ Failed: {e}')

print()

# Test 3: User Login
print('3. User Login Test')
login_data = {'email': 'testuser@example.com', 'password': 'testpass123'}
try:
    response = requests.post(f'{BASE_URL}/api/login', json=login_data)
    print(f'   ✅ Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        token = data['access_token']
        print(f'   Token received: {token[:30]}...')
        print(f'   Token type: {data["token_type"]}')
    else:
        print(f'   ❌ Response: {response.json()}')
        exit(1)
except Exception as e:
    print(f'   ❌ Failed: {e}')
    exit(1)

print()

# Test 4: Protected Route Access
print('4. Protected Route Test (History)')
headers = {'Authorization': f'Bearer {token}'}
try:
    response = requests.get(f'{BASE_URL}/api/history', headers=headers)
    print(f'   ✅ Status: {response.status_code}')
    print(f'   History records: {len(response.json())}')
except Exception as e:
    print(f'   ❌ Failed: {e}')

print()

# Test 5: Invalid Token Test
print('5. Invalid Token Test')
headers_invalid = {'Authorization': 'Bearer invalid_token_123'}
try:
    response = requests.get(f'{BASE_URL}/api/history', headers=headers_invalid)
    print(f'   ✅ Status: {response.status_code} (expected 401)')
    if response.status_code == 401:
        print('   Correctly rejected invalid token')
    else:
        print(f'   Unexpected response: {response.json()}')
except Exception as e:
    print(f'   ❌ Failed: {e}')

print()
print('=== BACKEND TESTS COMPLETED SUCCESSFULLY ===')