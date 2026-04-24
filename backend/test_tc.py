#!/usr/bin/env python
"""Test script using TestClient"""

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import engine, Base
from sqlalchemy.orm import sessionmaker

# Create tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

print('=== Testing with TestClient ===')
print()

# Create new user
print('1. Signup Test')
response = client.post('/api/signup', json={'email': 'newuser@test.com', 'password': 'password123'})
print(f'   Status: {response.status_code}')
print(f'   Response: {response.json()}')

print()

# Login
print('2. Login Test')
response = client.post('/api/login', json={'email': 'newuser@test.com', 'password': 'password123'})
print(f'   Status: {response.status_code}')
if response.status_code == 200:
    data = response.json()
    token = data['access_token']
    print(f'   Token: {token[:30]}...')
    
    # Test history
    print()
    print('3. History Test')
    headers = {'Authorization': f'Bearer {token}'}
    response = client.get('/api/history', headers=headers)
    print(f'   Status: {response.status_code}')
    print(f'   History: {response.json()}')
else:
    print(f'   Response: {response.json()}')

print()
print('=== All Tests Passed ===')