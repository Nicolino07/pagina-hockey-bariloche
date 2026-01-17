from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models.enums import TipoUsuario

class UsuarioCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    tipo: TipoUsuario = TipoUsuario.LECTOR
    creado_por: Optional[str] = None

class UsuarioUpdate(BaseModel):
    email: Optional[EmailStr] = None
    tipo: Optional[TipoUsuario] = None
    activo: Optional[bool] = None
    actualizado_por: Optional[str] = None

class Usuario(BaseModel):
    id_usuario: int
    username: str
    email: EmailStr
    tipo: TipoUsuario
    activo: bool

    ultimo_login: Optional[datetime]
    creado_en: datetime
    actualizado_en: Optional [datetime] = None

    model_config = ConfigDict(from_attributes=True)
    
## opcional autenticacion interna
class UsuarioAuthInterno(BaseModel):
    id_usuario: int
    username: str
    password_hash: str
    activo: bool
    intentos_fallidos: int
    bloqueado_hasta: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
