from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models.enums import TipoUsuario


class Usuario(BaseModel):
    id_usuario: int
    username: str
    email: EmailStr
    tipo: TipoUsuario
    activo: bool

    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None

    ultimo_login: Optional[datetime]
    creado_en: datetime
    actualizado_en: Optional [datetime] = None

    model_config = ConfigDict(from_attributes=True)

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


class UsuarioPerfilUpdate(BaseModel):
    """Edición del propio perfil: no incluye `tipo` ni `activo`, exclusivos
    de los endpoints de administración de SUPERUSUARIO."""
    nombre: Optional[str] = Field(None, max_length=100)
    apellido: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=30)
    email: Optional[EmailStr] = None


## opcional autenticacion interna
class UsuarioAuthInterno(BaseModel):
    id_usuario: int
    username: str
    password_hash: str
    activo: bool
    intentos_fallidos: int
    bloqueado_hasta: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)