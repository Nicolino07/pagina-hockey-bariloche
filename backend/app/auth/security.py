# backend/app/auth/security.py
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
import secrets
from hashlib import sha256
from typing import Optional

from app.core.config import settings

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)

def _utc_timestamp(dt: datetime) -> int:
    return int(dt.replace(tzinfo=timezone.utc).timestamp())


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()

    now = datetime.utcnow()
    expire = now + (expires_delta or settings.access_token_expire_timedelta)

    to_encode.update({
        "exp": _utc_timestamp(expire),
        "iat": _utc_timestamp(now),
        "type": "access",
    })

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def generate_refresh_token_value() -> str:
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    return sha256(token.encode()).hexdigest()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
