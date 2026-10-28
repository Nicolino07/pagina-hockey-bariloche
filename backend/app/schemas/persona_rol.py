from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import RolPersonaTipo


# =========================
# BASE (campos comunes)
# =========================

class PersonaRolBase(BaseModel):
    rol: RolPersonaTipo
    fecha_desde: date
    fecha_hasta: Optional[date] = None


# =========================
# CREATE
# =========================
# 👉 NO incluye id_persona
# 👉 fecha_desde puede ser automática
class PersonaRolCreate(BaseModel):
    rol: RolPersonaTipo
    fecha_desde: Optional[date] = None
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "rol": "JUGADOR",
                "fecha_desde": "2024-03-01",
                "creado_por": "admin"
            }
        }
    )

# =========================
# UPDATE
# =========================

class PersonaRolUpdate(BaseModel):
    fecha_hasta: Optional[date] = None
    actualizado_por: Optional[str] = Field(None, max_length=100)


# =========================
# READ (response)
# =========================

class PersonaRol(PersonaRolBase):
    id_persona_rol: int
    id_persona: int

    creado_en: datetime
    actualizado_en: Optional[datetime] = None
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
