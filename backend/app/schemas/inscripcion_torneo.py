from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.enums import GeneroCompetenciaTipo

class InscripcionTorneoBase(BaseModel):
    id_equipo: int = Field(..., gt=0)
    id_torneo: int = Field(..., gt=0)
    genero: GeneroCompetenciaTipo

class InscripcionTorneoCreate(InscripcionTorneoBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id_equipo": 3,
                "id_torneo": 1,
                "genero": "Masculino",
                "creado_por": "admin"
            }
        }
    )

class InscripcionTorneoUpdate(BaseModel):
    actualizado_por: Optional[str] = Field(None, max_length=100)

class InscripcionTorneo(InscripcionTorneoBase):
    id_inscripcion: int
    fecha_inscripcion: date

    creado_en: datetime
    actualizado_en: datetime
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id_inscripcion": 10,
                "id_equipo": 3,
                "id_torneo": 1,
                "genero": "Masculino",
                "fecha_inscripcion": "2026-01-07",
                "creado_en": "2026-01-07T10:00:00",
                "actualizado_en": "2026-01-07T10:00:00",
                "creado_por": "admin",
                "actualizado_por": None
            }
        }
    )
