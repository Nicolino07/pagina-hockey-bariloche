from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

class PlantelBase(BaseModel):
    id_equipo: int = Field(..., gt=0)
    fecha_creacion: Optional[date] = None
    activo: Optional[bool] = True

class PlantelCreate(PlantelBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id_equipo": 5,
                "creado_por": "admin"
            }
        }
    )

class PlantelUpdate(BaseModel):
    activo: Optional[bool] = None
    actualizado_por: Optional[str] = Field(None, max_length=100)

class Plantel(PlantelBase):
    id_plantel: int

    creado_en: datetime
    actualizado_en: datetime
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

