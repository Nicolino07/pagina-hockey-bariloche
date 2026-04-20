from typing import Optional, Literal
from pydantic import BaseModel

TipoFormatoPlayoff = Literal["ida", "ida_y_vuelta"]
TipoAsignacion = Literal["automatico", "manual"]


class DueloManual(BaseModel):
    """Par de equipos para el primer round del playoff manual."""
    id_equipo_local: int
    id_equipo_visitante: int


class GenerarPlayoffRequest(BaseModel):
    formato: TipoFormatoPlayoff = "ida"
    asignacion: TipoAsignacion = "automatico"
    duelos: Optional[list[DueloManual]] = None  # solo para asignacion=manual


class PlayoffPartidoPreview(BaseModel):
    ronda_nombre: str
    ronda_orden: int
    placeholder_local: Optional[str] = None
    placeholder_visitante: Optional[str] = None
    nombre_equipo_local: Optional[str] = None
    nombre_equipo_visitante: Optional[str] = None


class PlayoffPreviewResponse(BaseModel):
    total_rondas: int
    total_partidos: int
    formato: TipoFormatoPlayoff
    rondas: list[dict]


class PlayoffRondaCreate(BaseModel):
    nombre: str
    ida_y_vuelta: bool = False


class PlayoffRondaResponse(BaseModel):
    id_fixture_playoff_ronda: int
    id_torneo: int
    nombre: str
    orden: int
    ida_y_vuelta: bool

    class Config:
        from_attributes = True
