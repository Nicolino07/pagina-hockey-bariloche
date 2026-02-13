from pydantic import BaseModel, EmailStr
from app.models.enums import TipoUsuario

class UserInviteRequest(BaseModel):
    email: EmailStr
    tipo: TipoUsuario

class UserConfirm(BaseModel):
    token: str
    username: str
    password: str