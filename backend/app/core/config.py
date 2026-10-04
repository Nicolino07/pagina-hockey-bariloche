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

    resend_api_key: str
    frontend_url: str = "http://localhost:3000"

    access_token_expire_minutes: int = 1440
    refresh_token_expire_days: int = 30

    cookie_secure: bool = False
    cookie_samesite: str = "strict"

    # Bloqueo de login por cuenta: tras `max_login_attempts` fallos dentro de
    # `login_block_minutes`, el email queda bloqueado ese mismo tiempo.
    max_login_attempts: int = 5
    login_block_minutes: int = 15

    # Header con la IP real del cliente cuando la API está detrás de proxies
    # (en producción, "CF-Connecting-IP" de Cloudflare). Vacío = usar la IP de
    # la conexión. Solo es confiable si el servidor no acepta tráfico que no
    # venga de Cloudflare: cualquiera que llegue directo puede inventarlo.
    client_ip_header: str = ""

    @property
    def access_token_expire_timedelta(self) -> timedelta:
        return timedelta(minutes=self.access_token_expire_minutes)

    @property
    def refresh_token_expire_timedelta(self) -> timedelta:
        return timedelta(days=self.refresh_token_expire_days)


settings = Settings()
