from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

class PosicionBase(BaseModel):
    id_torneo: int = Field(..., gt=0)
    id_equipo: int = Field(..., gt=0)

class PosicionCreate(PosicionBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id_torneo": 3,
                "id_equipo": 12,
                "creado_por": "sistema"
            }
        }
    )

class PosicionUpdate(BaseModel):
    puntos: Optional[int] = Field(None, ge=0)
    partidos_jugados: Optional[int] = Field(None, ge=0)
    ganados: Optional[int] = Field(None, ge=0)
    empatados: Optional[int] = Field(None, ge=0)
    perdidos: Optional[int] = Field(None, ge=0)
    goles_a_favor: Optional[int] = Field(None, ge=0)
    goles_en_contra: Optional[int] = Field(None, ge=0)
    actualizado_por: Optional[str] = Field(None, max_length=100)

class Posicion(PosicionBase):
    id_posicion: int

    puntos: int
    partidos_jugados: int
    ganados: int
    empatados: int
    perdidos: int
    goles_a_favor: int
    goles_en_contra: int
    diferencia_gol: int

    creado_en: datetime
    actualizado_en: datetime
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
