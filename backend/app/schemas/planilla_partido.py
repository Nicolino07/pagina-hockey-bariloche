from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, time
from app.models.enums import ReferenciaGol
from app.models.enums import TipoTarjeta

# ---------------------------
# Datos básicos del partido
# ---------------------------
class PartidoPlanillaCreate(BaseModel):
    id_torneo: int
    id_fase: Optional[int] = None

    fecha: date
    horario: time | None = None

    id_inscripcion_local: int
    id_inscripcion_visitante: int

    id_arbitro1: Optional[int] = None
    id_arbitro2: Optional[int] = None

    id_capitan_local: Optional[int] = None
    id_capitan_visitante: Optional[int] = None

    juez_mesa_local: Optional[str] = None
    juez_mesa_visitante: Optional[str] = None

    ubicacion: str | None = None
    observaciones: Optional[str] = None
    numero_fecha: Optional[int] = None

# ---------------------------
# Participantes
# ---------------------------

class ParticipanteConCamiseta(BaseModel):
    id_plantel_integrante: int
    numero_camiseta: Optional[str] = None  # Usamos str por si hay números como "10A" o vacíos

class ParticipantesPlanilla(BaseModel):
    local: List[ParticipanteConCamiseta]     # Ahora es una lista de objetos, no de ints
    visitante: List[ParticipanteConCamiseta] # Ahora es una lista de objetos, no de ints

# ---------------------------
# Goles
# ---------------------------
class GolPlanillaCreate(BaseModel):
    id_plantel_integrante: int
    minuto: int
    cuarto: int | None = None
    referencia_gol: ReferenciaGol
    es_autogol: bool = False

# ----------------------------
# Tarjetas
# ----------------------------

class TarjetaPlanillaCreate(BaseModel):
    id_plantel_integrante: int
    tipo: TipoTarjeta
    minuto: Optional[int] = Field(None, ge=0)
    cuarto: Optional[int] = Field(None, ge=1, le=4)
    observaciones: Optional[str] = Field(None, max_length=500)


# ---------------------------
# PLANILLA COMPLETA
# ---------------------------
class PlanillaPartidoCreate(BaseModel):
    partido: PartidoPlanillaCreate
    participantes: ParticipantesPlanilla
    goles: list[GolPlanillaCreate] = []
    tarjetas: list[TarjetaPlanillaCreate] = []
    id_fixture_partido: Optional[int] = None  # Si viene, se vincula el fixture al partido real


# ---------------------------
# RESPUESTA PARA EDICIÓN
# ---------------------------
class ParticipanteEdicion(BaseModel):
    id_plantel_integrante: int
    numero_camiseta: Optional[str] = None

    class Config:
        from_attributes = True


class GolEdicion(BaseModel):
    id_plantel_integrante: int
    minuto: int
    cuarto: Optional[int] = None
    referencia_gol: str
    es_autogol: bool

    class Config:
        from_attributes = True


class TarjetaEdicion(BaseModel):
    id_plantel_integrante: int
    tipo: str
    minuto: Optional[int] = None
    cuarto: Optional[int] = None
    observaciones: Optional[str] = None

    class Config:
        from_attributes = True


class PartidoEdicionResponse(BaseModel):
    id_partido: int
    id_torneo: int
    id_fase: Optional[int] = None
    fecha: date
    horario: Optional[time] = None
    id_inscripcion_local: int
    id_inscripcion_visitante: int
    id_arbitro1: Optional[int] = None
    id_arbitro2: Optional[int] = None
    id_capitan_local: Optional[int] = None
    id_capitan_visitante: Optional[int] = None
    juez_mesa_local: Optional[str] = None
    juez_mesa_visitante: Optional[str] = None
    ubicacion: Optional[str] = None
    observaciones: Optional[str] = None
    numero_fecha: Optional[int] = None
    participantes_local: list[ParticipanteEdicion] = []
    participantes_visitante: list[ParticipanteEdicion] = []
    goles: list[GolEdicion] = []
    tarjetas: list[TarjetaEdicion] = []
    id_fixture_partido: Optional[int] = None

    class Config:
        from_attributes = True

