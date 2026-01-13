from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import os
import secrets
from hashlib import sha256

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 30))

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET no definido")


def hash_password(password: str) -> str:
    """
    Hashea una contraseña en texto plano usando Argon2id
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña contra su hash
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


REFRESH_EXPIRE_DAYS = 14

def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    return sha256(token.encode()).hexdigest()


def refresh_expiration() -> datetime:
    return datetime.utcnow() + timedelta(days=REFRESH_EXPIRE_DAYS)