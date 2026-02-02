from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import RolPersonaTipo


class FichajeRolBase(BaseModel):
    id_persona: int = Field(..., gt=0)
    id_club: int = Field(..., gt=0)
    rol: RolPersonaTipo
    fecha_inicio: Optional[date] = None


class FichajeRolCreate(FichajeRolBase):
    creado_por: Optional[str] = Field(None, max_length=100)


class FichajeRolBaja(BaseModel):
    fecha_fin: date
    actualizado_por: Optional[str] = Field(None, max_length=100)


class FichajeRolRead(FichajeRolBase):
    id_fichaje_rol: int
    fecha_fin: Optional[date]
    activo: bool

    model_config = ConfigDict(from_attributes=True)
