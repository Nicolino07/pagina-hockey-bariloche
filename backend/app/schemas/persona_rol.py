from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.enums import RolPersonaTipo

class PersonaRolBase(BaseModel):
    id_persona: int = Field(..., gt=0)
    rol: RolPersonaTipo
    fecha_desde: date
    fecha_hasta: Optional[date] = None

class PersonaRolBase(BaseModel):
    id_persona: int = Field(..., gt=0)
    rol: RolPersonaTipo
    fecha_desde: date
    fecha_hasta: Optional[date] = None

class PersonaRolCreate(PersonaRolBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id_persona": 12,
                "rol": "jugador",
                "fecha_desde": "2024-03-01",
                "creado_por": "admin"
            }
        }
    )

class PersonaRolUpdate(BaseModel):
    fecha_hasta: Optional[date] = None
    actualizado_por: Optional[str] = Field(None, max_length=100)

class PersonaRol(PersonaRolBase):
    id_persona_rol: int

    creado_en: datetime
    actualizado_en: datetime
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
