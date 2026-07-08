import os
from pydantic_settings import BaseSettings
from functools import lru_cache

# Find the absolute path to the .env file in the backend directory
_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(os.path.dirname(_current_dir))
_env_file_path = os.path.join(_backend_dir, ".env")


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # MongoDB
    MONGO_URI: str
    DB_NAME: str

    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 1440

    # UPI Payment
    UPI_MERCHANT_ID: str
    UPI_MERCHANT_NAME: str

    # App
    APP_NAME: str = "KiitEats"
    DEBUG: bool = True

    model_config = {
        "env_file": _env_file_path,
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — loaded once, reused everywhere."""
    return Settings()

