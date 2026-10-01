# Authentication and Authorization

## Overview

The backend uses bearer JWT authentication for protected analysis/history endpoints and role-based authorization for administrative endpoints.

## Password handling

Passwords are never stored in plaintext. The current backend uses:

```text
Passlib
  ↓
PBKDF2-SHA256
  ↓
stored password_hash
```

## JWT

Tokens are created with Python-JOSE.

Current defaults:

- Algorithm: HS256
- Access-token lifetime: 24 hours
- User ID: `sub` claim
- Role: `role` claim

Production signing uses the `SECRET_KEY` environment variable. The backend refuses to start on Render if that variable is missing.

## Authentication endpoints

### POST `/api/signup`

Request:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Creates a user with the default role `user`.

### POST `/api/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response shape:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### POST `/api/token`

OAuth2-compatible form endpoint used by the FastAPI Swagger authorization flow.

### GET `/api/history`

Requires:

```text
Authorization: Bearer <jwt>
```

Only records belonging to the authenticated `user_id` are returned.

### POST `/api/predict`

Requires the same bearer authentication and stores the prediction result against the authenticated user.

## Roles

Two roles are currently represented:

- `user` — normal application access.
- `admin` — access to `/api/admin/*` routes.

Admin authorization is checked on the server from the authenticated user record.

## Security behavior

- Invalid, expired, or malformed JWTs return HTTP 401.
- Non-admin users calling admin routes return HTTP 403.
- Password-check and token-generation logs do not contain passwords.
- CORS is restricted to local development and the deployed frontend origin.

## Production limitations

This authentication layer has not undergone an independent security audit or compliance assessment. The application is not represented as HIPAA-compliant.

For a production deployment handling sensitive information, add rate limiting, centralized secret management, monitoring, incident response, and a formal security review.
