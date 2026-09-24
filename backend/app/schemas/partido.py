from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator

from app.models.enums import MotivoPuntos



class PartidoBase(BaseModel):
    id_torneo: Optional[int] = None
    id_fase: Optional[int] = None

    fecha: Optional[date] = None
    horario: Optional[time] = None

    id_inscripcion_local: Optional[int] = None
    id_inscripcion_visitante: Optional[int] = None

    ubicacion: Optional[str] = Field(None, max_length=200)
    observaciones: Optional[str] = Field(None, max_length=1000)
    numero_fecha: Optional[int] = None

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
    actualizado_por: Optional[str] = Field(None, max_length=100)


class OtorgarPuntosRequest(BaseModel):
    goles_local: int = Field(..., ge=0, description="Goles a otorgar al equipo local")
    goles_visitante: int = Field(..., ge=0, description="Goles a otorgar al equipo visitante")
    motivo: MotivoPuntos = Field(
        ...,
        description="Motivo de la entrega. Obligatorio: es lo que se muestra en el detalle del partido.",
    )
    descripcion: Optional[str] = Field(
        None,
        max_length=500,
        description="Aclaración interna, opcional. No se publica en las vistas públicas.",
    )
    sin_puntos: bool = Field(
        False,
        description=(
            "No otorgar puntos a ninguno de los dos equipos. Sólo válido con "
            "NO_PRESENTARON_AMBOS: sin esta marca, un 0-0 repartiría 1 punto a cada uno."
        ),
    )
    actualizado_por: Optional[str] = Field(None, max_length=100)

    @model_validator(mode="after")
    def validar_coherencia(self):
        if self.sin_puntos and self.motivo != MotivoPuntos.NO_PRESENTARON_AMBOS:
            raise ValueError(
                "Sólo se puede dejar el partido sin puntos cuando no se presentó "
                "ninguno de los dos equipos."
            )
        if self.motivo == MotivoPuntos.OTRO and not (self.descripcion or "").strip():
            raise ValueError("Con el motivo OTRO hay que escribir una descripción.")
        return self



class DeshacerPuntosResponse(BaseModel):
    """Resultado de deshacer una entrega de puntos."""
    id_partido: int
    id_torneo: int
    estado_partido: str
    advertencias: List[str] = []


class DesignarArbitrosRequest(BaseModel):
    """Payload para designar (o quitar) los árbitros de un partido."""
    id_arbitro1: Optional[int] = None
    id_arbitro2: Optional[int] = None
    forzar: bool = Field(
        False,
        description=(
            "Si es True, permite designar árbitros marcados como no "
            "designables (el admin confirmó explícitamente el override)."
        ),
    )


class ArbitroDisponible(BaseModel):
    """Persona con rol ARBITRO y su disponibilidad para un partido concreto."""
    id_persona: int
    nombre: str
    apellido: str
    disponible: bool
    motivo: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PartidoDesignable(BaseModel):
    """Partido en estado BORRADOR/PENDIENTE candidato a designación de árbitros."""
    id_partido: int
    id_torneo: int
    nombre_torneo: Optional[str] = None
    categoria_torneo: Optional[str] = None
    genero_torneo: Optional[str] = None
    division_torneo: Optional[str] = None
    es_competitiva: bool
    numero_fecha: Optional[int] = None
    fecha: Optional[date] = None
    horario: Optional[time] = None
    ubicacion: Optional[str] = None
    estado_partido: str
    equipo_local: Optional[str] = None
    equipo_visitante: Optional[str] = None
    id_arbitro1: Optional[int] = None
    id_arbitro2: Optional[int] = None
    nombre_arbitro1: Optional[str] = None
    nombre_arbitro2: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PartidoDetalle(BaseModel):
    id_partido: int
    id_torneo: int
    id_club_local: Optional[int] = None
    id_club_visitante: Optional[int] = None
    categoria_torneo: Optional[str] = None
    genero_torneo: Optional[str] = None
    division_torneo: Optional[str] = None
    # Estos campos salen de columnas nullable o de LEFT JOIN de la vista, así
    # que el schema tiene que admitir None. Exigirlos hacía fallar el endpoint
    # entero por un solo partido sin fecha.
    nombre_torneo: Optional[str] = None
    fecha: Optional[date] = None
    horario: Optional[time] = None
    ubicacion: Optional[str] = None
    numero_fecha: Optional[int] = None
    observaciones: Optional[str] = None
    creado_por: Optional[str] = None
    creado_en: Optional[datetime] = None

    # Equipos y Marcador
    # Los nombres vienen de LEFT JOIN: un cruce de playoff todavía sin equipos
    # asignados (placeholder) los trae en None.
    equipo_local_nombre: Optional[str] = None
    equipo_visitante_nombre: Optional[str] = None
    goles_local: int = 0
    goles_visitante: int = 0

    # Árbitros y Jueces
    nombre_arbitro1: Optional[str] = None
    nombre_arbitro2: Optional[str] = None
    arbitros: Optional[str] = None
    juez_mesa_local: Optional[str] = None
    juez_mesa_visitante: Optional[str] = None
    
    # Listas concatenadas (Strings de la vista)
    lista_jugadores_local: Optional[str] = None
    lista_jugadores_visitante: Optional[str] = None
    lista_goles_local: Optional[str] = None
    lista_tarjetas_local: Optional[str] = None
    lista_goles_visitante: Optional[str] = None
    lista_tarjetas_visitante: Optional[str] = None

    # Definición por penales: SIEMPRE aparte del marcador. `goles_local` y
    # `goles_visitante` no la incluyen nunca.
    penales_local: int = 0
    penales_visitante: int = 0
    hubo_definicion_por_penales: bool = False
    lista_penales_local: Optional[str] = None
    lista_penales_visitante: Optional[str] = None

    # Entrega de puntos (walkover). Se publica el motivo, NUNCA la descripción,
    # que es una aclaración interna.
    motivo_puntos: Optional[str] = None
    sin_puntos: bool = False

    class Config:
        # Esto es lo más importante: permite que Pydantic lea los 
        # objetos de SQLAlchemy directamente (en Pydantic v2 se usa from_attributes)
        from_attributes = True