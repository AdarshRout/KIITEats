from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # MongoDB
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "kiiteats"

    # JWT
    JWT_SECRET: str = "super-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 60 * 24  # 24 hours

    # UPI Payment
    UPI_MERCHANT_ID: str = "adarshrout321@okicici"
    UPI_MERCHANT_NAME: str = "Adarsh_Rout"

    # App
    APP_NAME: str = "KiitEats"
    DEBUG: bool = True



    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — loaded once, reused everywhere."""
    return Settings()
