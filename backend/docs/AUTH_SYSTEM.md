# 🔐 Respiratory AI — Authentication System

A robust security layer based on **OAuth2 with Password and Bearer (JWT)**, designed for clinical data isolation and role-based access control.

## 🏗️ Technical Specifications

### Security Standards
- **Hashing**: Argon2 (via `passlib`) — Memory-hard and resistant to GPU-based brute-force attacks.
- **Tokens**: JSON Web Tokens (JWT) using the `HS256` algorithm.
- **Protocol**: OAuth2 compliant with `Bearer` token scheme.

### Role-Based Access Control (RBAC)
The system supports two distinct roles:
1.  **User**: Standard access to diagnostics, history, and reporting.
2.  **Admin**: Global access to user management, system analytics, and administrative tools.

## 🔌 API Endpoints

### 1. Signup (`POST /api/signup`)
Registers a new user and hashes the password.
- **Input**: `{ "email": "...", "password": "..." }`
- **Output**: User object (without password).

### 2. Login (`POST /api/login`)
Authenticates credentials and issues a JWT.
- **Input**: `{ "email": "...", "password": "..." }`
- **Output**: `{ "access_token": "...", "token_type": "bearer" }`

### 3. Current User (`GET /api/users/me`)
Retrieves the profile of the currently authenticated user.

## 🛡️ Security Implementation Details

- **Token Expiration**: Access tokens are valid for **24 hours**.
- **Data Isolation**: All diagnostic records are linked to a specific `user_id`, ensuring patients only see their own data.
- **Middlewares**: FastAPI dependencies (`get_current_user`) validate the JWT on every protected request.
- **Error Handling**: Standard HTTP 401 (Unauthorized) and 403 (Forbidden) responses for authentication/authorization failures.

## 🛠️ Maintenance & Configuration
- **Secret Key**: Defined in `app.core.config`. For production, this should be set via the `SECRET_KEY` environment variable.
- **Database**: SQLite for development, PostgreSQL recommended for production.
