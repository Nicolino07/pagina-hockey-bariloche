# app/schemas/temporada.py
from datetime import datetime, date
from typing import Optional, List, Literal

from pydantic import BaseModel, Field, ConfigDict

from app.models.enums import CategoriaTipo, GeneroTipo, RolTorneoTemporada, TipoTorneo
from app.schemas.fixture_playoff import DueloManual


class TemporadaBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    anio: int = Field(..., ge=1900, le=2200)
    categoria: CategoriaTipo
    division: Optional[str] = Field(None, max_length=30)
    genero: GeneroTipo
    activa: bool = True


class TemporadaCreate(TemporadaBase):
    pass


class TemporadaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    activa: Optional[bool] = None


class TorneoEnTemporada(BaseModel):
    """Torneo asociado a una temporada, con el papel que juega en ella."""
    id_torneo: int
    nombre: str
    tipo: TipoTorneo
    rol_en_temporada: Optional[RolTorneoTemporada] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    activo: bool = True

    model_config = ConfigDict(from_attributes=True)


class TemporadaSchema(TemporadaBase):
    id_temporada: int
    creado_en: datetime
    actualizado_en: Optional[datetime] = None
    borrado_en: Optional[datetime] = None
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    torneos: List[TorneoEnTemporada] = []

    model_config = ConfigDict(from_attributes=True)


class AsignarTorneoRequest(BaseModel):
    """Asocia un torneo a la temporada con un rol, o lo desasocia.

    Con `rol = None` el torneo sale de la temporada. La restricción
    `chk_torneo_rol_requiere_temporada` impide dejar un rol sin temporada.
    """
    id_torneo: int = Field(..., gt=0)
    rol: Optional[RolTorneoTemporada] = None


class FilaTablaAnual(BaseModel):
    """Fila de la tabla anual (vista `vw_tabla_posiciones_anual`)."""
    id_temporada: int
    temporada: str
    anio: int
    categoria: str
    division: Optional[str] = None
    genero: str

    id_equipo: int
    equipo: str
    id_club: int

    puesto: int
    torneos_computados: int
    partidos_jugados: int
    ganados: int
    empatados: int
    perdidos: int
    goles_a_favor: int
    goles_en_contra: int
    diferencia_gol: int
    puntos: int

    model_config = ConfigDict(from_attributes=True)


class TorneoComputable(BaseModel):
    """Torneo candidato del selector de la tabla anual, con su estado actual."""
    id_torneo: int
    nombre: str
    tipo: TipoTorneo
    fecha_inicio: Optional[date] = None
    activo: bool = True
    computa: bool

    model_config = ConfigDict(from_attributes=True)


class SelectorTablaAnual(BaseModel):
    """Lo que necesita el selector: la liga, su temporada (si ya existe) y los
    torneos candidatos con el tilde puesto en los que suman."""
    anio: int
    categoria: CategoriaTipo
    division: Optional[str] = None
    genero: GeneroTipo
    id_temporada: Optional[int] = None
    nombre_temporada: Optional[str] = None
    torneos: List[TorneoComputable] = []


class DefinirComputablesRequest(BaseModel):
    """Estado final del selector: los torneos tildados para la tabla anual."""
    anio: int = Field(..., ge=1900, le=2200)
    categoria: CategoriaTipo
    division: Optional[str] = Field(None, max_length=30)
    genero: GeneroTipo
    id_torneos: List[int] = Field(default_factory=list)


# ── Playoff por el campeón anual ──────────────────────────────────────────────

RondaInicialAnual = Literal["octavos", "cuartos", "semifinal", "final"]


class CrearPlayoffAnualRequest(BaseModel):
    """Alta del playoff por el campeón del año de una temporada.

    A diferencia del playoff común, no se elige un torneo base: los equipos
    salen de la tabla anual de la temporada. La ronda inicial es obligatoria
    porque es la que define cuántos clasifican (octavos 16, cuartos 8,
    semifinal 4, final 2).

    En `automatico` clasifican los mejores de la tabla y se siembran mejor
    contra peor. En `manual` el admin arma los duelos de la primera ronda —
    solo con equipos de la tabla anual — y de ahí en adelante el bracket sigue
    solo con los ganadores.
    """
    nombre: str = Field(..., min_length=1, max_length=100)
    fecha_inicio: Optional[date] = None
    ronda_inicial: RondaInicialAnual
    formato: Literal["ida", "ida_y_vuelta"] = "ida"
    asignacion: Literal["automatico", "manual"] = "automatico"
    duelos: Optional[List[DueloManual]] = None
    tercer_puesto: bool = False
    es_competitiva: bool = True
    # Copiar al playoff la última nómina del año de cada equipo clasificado.
    copiar_planteles: bool = True


class PlantelOmitido(BaseModel):
    """Integrante que no se pudo heredar al playoff, con el motivo."""
    equipo: str
    id_persona: int
    nombre: str
    motivo: str


class PlayoffAnualResponse(BaseModel):
    """Resultado del alta: el torneo creado y qué quedó pendiente a mano."""
    id_torneo: int
    nombre: str
    id_temporada: int
    equipos: List[str] = []
    planteles_copiados: int = 0
    planteles_omitidos: List[PlantelOmitido] = []
    # Equipos que no tenían nómina propia en ningún torneo del año.
    avisos: List[str] = []
