from pydantic import BaseModel
from datetime import date
from typing import Optional

class Arbitro(BaseModel):
    id_arbitro: int
    nombre: str
    apellido: str
    fecha_nacimiento: Optional[date] = None   # ← AQUÍ EL CAMBIO
    dni: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None

    model_config = {
        "from_attributes": True  # reemplaza orm_mode en Pydantic v2
    }


class ArbitroCreate(BaseModel):
    nombre: str
    apellido: str
    fecha_nacimiento: Optional[date] = None   # ← TAMBIÉN AQUÍ
    dni: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
