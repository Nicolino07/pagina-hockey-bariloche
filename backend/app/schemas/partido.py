from datetime import date, time, datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

class PartidoBase(BaseModel):
    id_torneo: int = Field(..., gt=0)
    id_fase: Optional[int] = None

    fecha: Optional[date] = None
    horario: Optional[time] = None

    id_inscripcion_local: int = Field(..., gt=0)
    id_inscripcion_visitante: int = Field(..., gt=0)

    ubicacion: Optional[str] = Field(None, max_length=200)
    observaciones: Optional[str] = Field(None, max_length=1000)
    numero_fecha: Optional[int] = Field(None, gt=0)

class PartidoCreate(PartidoBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id_torneo": 1,
                "id_fase": 2,
                "fecha": "2026-02-10",
                "horario": "15:30",
                "id_inscripcion_local": 5,
                "id_inscripcion_visitante": 8,
                "ubicacion": "Cancha Central",
                "numero_fecha": 3,
                "creado_por": "admin"
            }
        }
    )

class PartidoUpdate(BaseModel):
    fecha: Optional[date] = None
    horario: Optional[time] = None

    id_arbitro1: Optional[int] = None
    id_arbitro2: Optional[int] = None

    id_capitan_local: Optional[int] = None
    id_capitan_visitante: Optional[int] = None

    juez_mesa_local: Optional[str] = Field(None, max_length=100)
    juez_mesa_visitante: Optional[str] = Field(None, max_length=100)

    ubicacion: Optional[str] = Field(None, max_length=200)
    observaciones: Optional[str] = Field(None, max_length=1000)

    actualizado_por: Optional[str] = Field(None, max_length=100)
    
class PartidoResultadoUpdate(BaseModel):
    goles_local: int = Field(..., ge=0)
    goles_visitante: int = Field(..., ge=0)
    actualizado_por: Optional[str] = Field(None, max_length=100)
