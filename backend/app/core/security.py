from passlib.hash import pbkdf2_sha256

def hash_password(password: str) -> str:
    """Hash a password using standard PBKDF2."""
    return pbkdf2_sha256.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against the stored hash with debug logging."""
    try:
        is_valid = pbkdf2_sha256.verify(plain_password, hashed_password)
        print(f"🔐 Password verification result: {is_valid}")
        return is_valid
    except Exception as e:
        print(f"❌ Password verification error: {e}")
        return False
