# app/schemas/vistas.py

from pydantic import BaseModel
from typing import Optional, Union
from datetime import date
from app.models.enums import RolPersonaTipo

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
    rol: RolPersonaTipo
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None

    class Config:
        from_attributes = True