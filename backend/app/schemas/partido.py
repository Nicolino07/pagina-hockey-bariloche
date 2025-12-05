from pydantic import BaseModel
from typing import Optional

class PartidoBase(BaseModel):
    id_torneo: int
    id_fase: Optional[int] = None
    fecha: Optional[str] = None
    horario: Optional[str] = None
    id_local: int
    id_visitante: int
    goles_local: Optional[int] = 0
    goles_visitante: Optional[int] = 0
    id_arbitro1: Optional[int] = None
    id_arbitro2: Optional[int] = None
    ubicacion: Optional[str] = None
    observaciones: Optional[str] = None
    tipo_fase: Optional[str] = "liga"
    numero_fecha: Optional[int] = None


class PartidoCreate(PartidoBase):
    """Schema para crear partido (POST)"""
    pass


class PartidoUpdate(BaseModel):
    """Schema para actualizar partido (PUT) — todos los campos opcionales"""
    id_torneo: Optional[int] = None
    id_fase: Optional[int] = None
    fecha: Optional[str] = None
    horario: Optional[str] = None
    id_local: Optional[int] = None
    id_visitante: Optional[int] = None
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    id_arbitro1: Optional[int] = None
    id_arbitro2: Optional[int] = None
    ubicacion: Optional[str] = None
    observaciones: Optional[str] = None
    tipo_fase: Optional[str] = None
    numero_fecha: Optional[int] = None


class PartidoOut(PartidoBase):
    """Schema de salida (GET, POST response)"""
    id_partido: int

    class Config:
        from_attributes = True
