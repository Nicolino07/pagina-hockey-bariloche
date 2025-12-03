from pydantic import BaseModel
from typing import Optional

class TorneoBase(BaseModel):
    nombre: str
    categoria: str
    genero: str
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    activo: Optional[bool] = True


class TorneoCreate(TorneoBase):
    pass


class Torneo(TorneoBase):
    id_torneo: int

    class Config:
        from_attributes = True
