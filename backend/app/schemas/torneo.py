from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.enums import CategoriaTipo, GeneroCompetenciaTipo

class TorneoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    categoria: CategoriaTipo
    genero: GeneroCompetenciaTipo
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None

class TorneoCreate(TorneoBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nombre": "Torneo Apertura 2026",
                "categoria": "A",
                "genero": "Masculino",
                "fecha_inicio": "2026-03-01",
                "fecha_fin": "2026-07-15",
                "creado_por": "admin"
            }
        }
    )

class TorneoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    activo: Optional[bool] = None
    actualizado_por: Optional[str] = Field(None, max_length=100)


class Torneo(TorneoBase):
    id_torneo: int
    activo: bool

    creado_en: datetime
    actualizado_en: datetime
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
