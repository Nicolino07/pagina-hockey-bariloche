from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict



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



class PartidoDetalle(BaseModel):
    id_partido: int
    id_torneo: int
    categoria_torneo: Optional[str] = None
    genero_torneo: Optional[str] = None
    division_torneo: Optional[str] = None
    nombre_torneo: str
    fecha: date
    horario: Optional[time] = None
    ubicacion: Optional[str] = None
    numero_fecha: Optional[int] = None
    observaciones: Optional[str] = None
    creado_por: Optional[str] = None
    creado_en: Optional[datetime] = None
    
    # Equipos y Marcador
    equipo_local_nombre: str
    equipo_visitante_nombre: str
    goles_local: int
    goles_visitante: int

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

    class Config:
        # Esto es lo más importante: permite que Pydantic lea los 
        # objetos de SQLAlchemy directamente (en Pydantic v2 se usa from_attributes)
        from_attributes = True