from passlib.hash import pbkdf2_sha256

def hash_password(password: str) -> str:
    """Hash a password using standard PBKDF2."""
    return pbkdf2_sha256.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against the stored hash."""
    try:
        return pbkdf2_sha256.verify(plain_password, hashed_password)
    except Exception:
        return False
