from pydantic import BaseModel
from typing import Optional


class PosicionBase(BaseModel):
    id_torneo: int
    id_equipo: int
    puntos: Optional[int] = 0
    partidos_jugados: Optional[int] = 0
    ganados: Optional[int] = 0
    empatados: Optional[int] = 0
    perdidos: Optional[int] = 0
    goles_a_favor: Optional[int] = 0
    goles_en_contra: Optional[int] = 0
    # diferencia_gol: se genera automáticamente
    fecha_actualizacion: Optional[str] = None


class PosicionCreate(PosicionBase):
    pass


class Posicion(PosicionBase):
    id_posicion: int
    diferencia_gol: int

    class Config:
        from_attributes = True
