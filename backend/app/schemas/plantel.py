from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# ======================
# Base
# ======================
class PlantelBase(BaseModel):
    id_equipo: int = Field(..., gt=0)
    nombre: str = Field(..., min_length=1, max_length=100)
    temporada: str = Field(..., max_length=10)
    descripcion: Optional[str] = None

    fecha_apertura: Optional[date] = None
    fecha_cierre: Optional[date] = None

    activo: bool = True


# ======================
# Create
# ======================
class PlantelCreate(PlantelBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id_equipo": 5,
                "nombre": "Plantel Primera",
                "temporada": "2024-2025",
                "descripcion": "Plantel oficial de primera división",
                "creado_por": "admin"
            }
        }
    )


# ======================
# Update
# ======================
class PlantelUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    temporada: Optional[str] = Field(None, max_length=10)
    descripcion: Optional[str] = None

    fecha_apertura: Optional[date] = None
    fecha_cierre: Optional[date] = None
    activo: Optional[bool] = None

    actualizado_por: Optional[str] = Field(None, max_length=100)


# ======================
# Read
# ======================
class PlantelRead(PlantelBase):
    id_plantel: int

    creado_en: datetime
    actualizado_en: Optional[datetime] = None
    borrado_en: Optional[datetime] = None

    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
