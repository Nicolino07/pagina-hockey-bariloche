from pydantic import BaseModel
from typing import Optional

class ArbitroBase(BaseModel):
    nombre: str
    apellido: str
    fecha_nacimiento: Optional[str] = None
    dni: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None


class ArbitroCreate(ArbitroBase):
    pass


class Arbitro(ArbitroBase):
    id_arbitro: int

    class Config:
        from_attributes = True
