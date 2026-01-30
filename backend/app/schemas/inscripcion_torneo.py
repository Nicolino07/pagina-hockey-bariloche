from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

class InscripcionTorneoBase(BaseModel):
    id_equipo: int = Field(..., gt=0)
    id_torneo: int = Field(..., gt=0)

class InscripcionTorneoRead(BaseModel):
    id_inscripcion: int
    id_equipo: int
    id_torneo: int

    fecha_inscripcion: date
    fecha_baja: Optional[datetime]

    creado_en: datetime
    actualizado_en: Optional[datetime]

    creado_por: Optional[str]
    actualizado_por: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class InscripcionTorneoCreate(BaseModel):
    id_equipo: int = Field(..., gt=0)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id_equipo": 3
            }
        }
    )

class InscripcionTorneoAction(BaseModel):
    id_inscripcion: int
    id_equipo: int
    id_torneo: int




