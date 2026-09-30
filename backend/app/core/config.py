import os


_DEV_SECRET_KEY = "dev_secret_key_only_for_local_development"

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if os.getenv("RENDER"):
        raise RuntimeError(
            "SECRET_KEY environment variable is required when running on Render."
        )
    SECRET_KEY = _DEV_SECRET_KEY

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))
