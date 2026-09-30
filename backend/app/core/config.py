import os


SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "dev_secret_key_only_for_local_development"
)
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))
