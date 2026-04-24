from passlib.exc import MissingBackendError, UnknownHashError
from passlib.hash import argon2, pbkdf2_sha256


def hash_password(password: str) -> str:
    """Hash a password, falling back if Argon2 support is unavailable."""
    try:
        return argon2.hash(password)
    except MissingBackendError:
        return pbkdf2_sha256.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against the stored hash."""
    try:
        if argon2.identify(hashed_password):
            return argon2.verify(plain_password, hashed_password)
        if pbkdf2_sha256.identify(hashed_password):
            return pbkdf2_sha256.verify(plain_password, hashed_password)
        return False
    except (MissingBackendError, UnknownHashError):
        try:
            if pbkdf2_sha256.identify(hashed_password):
                return pbkdf2_sha256.verify(plain_password, hashed_password)
            return False
        except UnknownHashError:
            return False
