from pydantic import BaseModel, EmailStr
from app.models.enums import TipoUsuario

class UserInviteRequest(BaseModel):
    email: EmailStr
    tipo: TipoUsuario

class UserConfirm(BaseModel):
    token: str
    username: str
    password: str

from pydantic import BaseModel, EmailStr, Field, validator

# 1. Para cuando el usuario está logueado y quiere cambiar su clave
class PasswordChangeRequest(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, description="La nueva contraseña debe tener al menos 8 caracteres")

# 2. Para solicitar el link de recuperación (Olvido su clave)
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# 3. Para el formulario final de resetear contraseña usando el token del mail
class ResetPasswordConfirm(BaseModel):
    token: str = Field(..., description="El token JWT recibido en el link")
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
    def password_not_empty(cls, v):
        if not v.strip():
            raise ValueError('La contraseña no puede estar vacía')
        return v