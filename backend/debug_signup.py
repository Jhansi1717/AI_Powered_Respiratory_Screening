#!/usr/bin/env python
"""Debug script to test signup endpoint"""

import sys
import os
sys.path.insert(0, os.getcwd())

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine

# Create tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

# Test signup
response = client.post(
    "/api/signup",
    json={"email": "test@example.com", "password": "password123"}
)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
