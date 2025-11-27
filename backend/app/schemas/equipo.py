from pydantic import BaseModel, ConfigDict
from typing import Optional

class EquipoBase(BaseModel):
    nombre: str
    id_club: int
    categoria: str
    genero: str

class EquipoCreate(EquipoBase):
    pass

class EquipoUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    genero: Optional[str] = None

class Equipo(EquipoBase):
    id_equipo: int
    model_config = ConfigDict(from_attributes=True)