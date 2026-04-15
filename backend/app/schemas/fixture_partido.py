from datetime import date, datetime, time
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, field_validator
from app.schemas.validators import corregir_anio_fecha

EstadoPartido = Literal["BORRADOR", "TERMINADO", "SUSPENDIDO", "ANULADO", "REPROGRAMADO"]


class FixturePartidoCreate(BaseModel):
    """Datos para programar un partido futuro."""
    id_torneo: int
    id_equipo_local: int
    id_equipo_visitante: int
    fecha_programada: Optional[date] = None
    horario: Optional[time] = None
    ubicacion: Optional[str] = None
    numero_fecha: Optional[int] = None

    @field_validator("fecha_programada", mode="after")
    @classmethod
    def validar_fecha(cls, v: Optional[date]) -> Optional[date]:
        return corregir_anio_fecha(v) if v is not None else v


class FixturePartidoUpdate(BaseModel):
    """Campos editables de un partido programado."""
    fecha_programada: Optional[date] = None
    horario: Optional[time] = None
    ubicacion: Optional[str] = None
    numero_fecha: Optional[int] = None
    estado: Optional[EstadoPartido] = None

    @field_validator("fecha_programada", mode="after")
    @classmethod
    def validar_fecha(cls, v: Optional[date]) -> Optional[date]:
        return corregir_anio_fecha(v) if v is not None else v


class FixturePartidoResponse(BaseModel):
    id_fixture_partido: int
    id_torneo: int
    id_equipo_local: int
    id_equipo_visitante: int
    nombre_equipo_local: Optional[str] = None
    nombre_equipo_visitante: Optional[str] = None
    nombre_torneo: Optional[str] = None
    categoria: Optional[str] = None
    division: Optional[str] = None
    genero: Optional[str] = None
    fecha_programada: Optional[date]
    horario: Optional[time]
    ubicacion: Optional[str]
    numero_fecha: Optional[int]
    estado: EstadoPartido
    id_partido_real: Optional[int]
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    creado_en: datetime
    creado_por: Optional[str]

    model_config = ConfigDict(from_attributes=True)
