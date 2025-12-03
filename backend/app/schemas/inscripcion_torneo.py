from pydantic import BaseModel
from typing import Optional


class InscripcionTorneoBase(BaseModel):
    id_equipo: int
    id_torneo: int
    categoria: str
    genero: str
    fecha_inscripcion: Optional[str] = None


class InscripcionTorneoCreate(InscripcionTorneoBase):
    pass


class InscripcionTorneo(InscripcionTorneoBase):
    id_inscripcion: int

    class Config:
        from_attributes = True
