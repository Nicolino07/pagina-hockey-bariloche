from typing import Optional
from pydantic import BaseModel
from datetime import date

class PersonaRolCreate(BaseModel):
    rol: str
    fecha_desde: Optional[date] = date.today()

class PersonaRolRead(BaseModel):
    id_persona_rol: int
    rol: str
    fecha_desde: date
    fecha_hasta: date | None

    class Config:
        from_attributes = True
