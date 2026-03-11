from datetime import date, datetime, time
from typing import Optional
from pydantic import BaseModel, ConfigDict


class FixturePartidoCreate(BaseModel):
    """Datos para programar un partido futuro."""
    id_torneo: int
    id_equipo_local: int
    id_equipo_visitante: int
    fecha_programada: Optional[date] = None
    horario: Optional[time] = None
    ubicacion: Optional[str] = None
    numero_fecha: Optional[int] = None


class FixturePartidoUpdate(BaseModel):
    """Campos editables de un partido programado."""
    fecha_programada: Optional[date] = None
    horario: Optional[time] = None
    ubicacion: Optional[str] = None
    numero_fecha: Optional[int] = None


class FixturePartidoResponse(BaseModel):
    id_fixture_partido: int
    id_torneo: int
    id_equipo_local: int
    id_equipo_visitante: int
    nombre_equipo_local: Optional[str] = None
    nombre_equipo_visitante: Optional[str] = None
    nombre_torneo: Optional[str] = None
    fecha_programada: Optional[date]
    horario: Optional[time]
    ubicacion: Optional[str]
    numero_fecha: Optional[int]
    jugado: bool
    id_partido_real: Optional[int]
    creado_en: datetime
    creado_por: Optional[str]

    model_config = ConfigDict(from_attributes=True)
