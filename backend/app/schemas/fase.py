from pydantic import BaseModel
from typing import Optional

class FaseBase(BaseModel):
    torneo_id: int
    nombre: str
    tipo: str
    orden: Optional[int] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None


class FaseCreate(FaseBase):
    pass


class Fase(FaseBase):
    id_fase: int

    class Config:
        from_attributes = True
