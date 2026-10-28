from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import RolPersonaTipo

class FichajeRolBase(BaseModel):
    id_persona: int = Field(..., gt=0)
    id_club: int = Field(..., gt=0)
    rol: RolPersonaTipo
    fecha_inicio: Optional[date] = None


class FichajeRolCreate(FichajeRolBase):
    creado_por: Optional[str] = Field(None, max_length=100)


class FichajeRolBaja(BaseModel):
    fecha_fin: date
    actualizado_por: Optional[str] = Field(None, max_length=100)


class FichajeRolRead(FichajeRolBase):
    id_fichaje_rol: int
    fecha_fin: Optional[date]
    activo: bool

    model_config = ConfigDict(from_attributes=True)



class FichajeConPersona(BaseModel):
    id_fichaje_rol: int
    id_persona: int
    id_club: int
    id_persona_rol: int
    rol: str
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    activo: bool
    
    # Datos de la persona
    persona_nombre: str
    persona_apellido: str
    persona_genero: str
    persona_documento: int
    
    class Config:
        from_attributes = True



class PlantelImpactadoBaja(BaseModel):
    """Un plantel del que la persona sale por efecto cascada de la baja."""
    id_plantel_integrante: int
    id_plantel: int
    plantel_nombre: str
    id_equipo: int
    equipo_nombre: str
    equipo_categoria: Optional[str] = None
    equipo_division: Optional[str] = None
    equipo_genero: Optional[str] = None
    rol_en_plantel: str
    numero_camiseta: Optional[int] = None
    id_torneo: Optional[int] = None
    torneo_nombre: Optional[str] = None
    fecha_alta: date
    plantel_cerrado: bool = False

    model_config = ConfigDict(from_attributes=True)


class RolImpactadoBaja(BaseModel):
    """Un rol vigente en el club que la baja general va a cerrar."""
    id_fichaje_rol: int
    rol: str
    fecha_inicio: date
    #: Planteles abiertos, de los que la persona efectivamente sale.
    planteles: list[PlantelImpactadoBaja]
    #: Planteles ya cerrados: la baja no los toca, quedan como historial.
    planteles_historial: list[PlantelImpactadoBaja] = []

    model_config = ConfigDict(from_attributes=True)


class BajaClubPreview(BaseModel):
    """
    Impacto de la baja general de una persona en un club, para mostrarle al
    usuario antes de confirmar: cierra TODOS sus roles vigentes en el club y la
    saca de los planteles **abiertos** que dependen de ellos.

    Los planteles ya cerrados no se tocan: son el registro histórico del torneo
    y la persona sigue figurando en ellos como integrante.
    """
    id_persona: int
    persona_nombre: str
    persona_apellido: str
    persona_documento: int
    id_club: int
    club_nombre: str
    roles: list[RolImpactadoBaja]
    total_planteles: int
    total_historial: int = 0


class BajaClubRequest(BaseModel):
    fecha_fin: date
    actualizado_por: Optional[str] = Field(None, max_length=100)


class BajaClubResultado(BaseModel):
    id_persona: int
    id_club: int
    roles_dados_de_baja: list[str]
    planteles_dados_de_baja: int
    fecha_fin: date
