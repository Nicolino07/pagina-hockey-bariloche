# app/schemas/vistas.py

from pydantic import BaseModel
from typing import Optional, Union
from datetime import date
from app.models.enums import RolPersonaTipo, GeneroTipo

class PlantelActivoIntegrante(BaseModel):
    id_equipo: int
    id_plantel: int
    id_plantel_integrante: int

    rol_en_plantel: RolPersonaTipo
    numero_camiseta: Optional[int]

    fecha_alta: date
    fecha_baja: Optional[date]

    id_persona: int
    nombre: str
    apellido: str
    documento: Optional[int]

    class Config:
        from_attributes = True


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
