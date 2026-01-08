from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class RefreshTokenCreate(BaseModel):
    id_usuario: int
    token_hash: str
    expires_at: datetime
    created_by_ip: Optional[str] = None
    user_agent: Optional[str] = None

class RefreshTokenDB(BaseModel):
    id_refresh_token: int
    id_usuario: int
    token_hash: str
    expires_at: datetime
    revoked: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RefreshTokenRevoke(BaseModel):
    revoked: bool = True
