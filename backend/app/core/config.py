# backend/app/core/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from datetime import timedelta

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
    )

    database_url: str

    jwt_secret: str
    jwt_algorithm: str = "HS256"

    access_token_expire_minutes: int = 1440
    refresh_token_expire_days: int = 30

    @property
    def access_token_expire_timedelta(self) -> timedelta:
        return timedelta(minutes=self.access_token_expire_minutes)

    @property
    def refresh_token_expire_timedelta(self) -> timedelta:
        return timedelta(days=self.refresh_token_expire_days)


settings = Settings()
