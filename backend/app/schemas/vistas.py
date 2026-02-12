# app/schemas/vistas.py

from pydantic import BaseModel
from typing import Literal, Optional, Union
from datetime import date
from app.models.enums import RolPersonaTipo, GeneroTipo


class PosicionSchema(BaseModel):
    id_torneo: int
    torneo: str
    id_equipo: int
    equipo: str
    partidos_jugados: int
    ganados: int
    empatados: int
    perdidos: int
    goles_a_favor: int
    goles_en_contra: int
    diferencia_gol: int
    puntos: int

    class Config:
        from_attributes = True # Para que funcione bien con ORMs como SQLAlchemy

class PersonaConRol(BaseModel):
    """Schema para la vista vw_persona_roles"""
    id_persona: int
    nombre: str
    apellido: str
    documento: Optional[Union[str, int]] = None  # Acepta string o integer
    genero: GeneroTipo
    rol: RolPersonaTipo
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None

    class Config:
        from_attributes = True


# inscripcion_torneo_detalle

class InscripcionTorneoDetalle(BaseModel):
    """ Schema para la vista vw_inscripcion_torneo_detalle """
    id_inscripcion: int
    id_torneo: int
    id_equipo: int

    nombre_equipo: str
    categoria_equipo: str
    genero_equipo: str

    id_club: int
    nombre_club: str

    fecha_inscripcion: date
    fecha_baja: Optional[date] = None

    class Config:
        from_attributes = True

# vista club_personas_roles

class ClubPersonaRolOut(BaseModel):
    id_persona: int
    nombre: str
    apellido: str
    documento: Optional[int]

    rol: RolPersonaTipo
    origen_rol: Literal["FICHAJE", "PLANTEL"]

    id_equipo: Optional[int]
    id_plantel: Optional[int]

    fecha_inicio: date
    fecha_fin: Optional[date]
    activo: bool

    class Config:
        from_attributes = True

# Vista personas_roles_clubes
class PersonaRolClubRead(BaseModel):
    id_persona: int
    nombre: str
    apellido: str
    rol: str | None
    estado_fichaje: str
    nombre_club: str | None

    class Config:
        from_attributes = True

class PlantelActivoIntegrante(BaseModel):
    id_plantel: int
    id_equipo: int
    nombre_plantel: str
    temporada: str
    plantel_activo: bool
    
    # Estos deben ser Optional (pueden ser None)
    id_plantel_integrante: Optional[int] = None
    id_persona: Optional[int] = None
    nombre_persona: Optional[str] = None
    apellido_persona: Optional[str] = None
    documento: Optional[int] = None
    rol_en_plantel: Optional[str] = None
    numero_camiseta: Optional[int] = None
    fecha_alta: Optional[date] = None
    fecha_baja: Optional[date] = None

    class Config:
        from_attributes = True

class PersonasArbitro(BaseModel):
    
    id_persona_rol: int
    nombre: str
    apellido: str
    documento: Optional[int] = None
    rol: RolPersonaTipo

    class Config:
        from_attributes = True

