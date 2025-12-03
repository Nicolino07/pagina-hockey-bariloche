from pydantic import BaseModel
from typing import Optional

class TarjetaBase(BaseModel):
    id_partido: int
    id_participante_partido: int
    tipo: str
    minuto: Optional[int] = None
    cuarto: Optional[int] = None
    observaciones: Optional[str] = None


class TarjetaCreate(TarjetaBase):
    pass


class Tarjeta(TarjetaBase):
    id_tarjeta: int

    class Config:
        from_attributes = True
