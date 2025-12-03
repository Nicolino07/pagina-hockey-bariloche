from pydantic import BaseModel
from typing import Optional

class EntrenadorBase(BaseModel):
    dni: Optional[str] = None
    nombre: str
    apellido: str
    fecha_nacimiento: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None


class EntrenadorCreate(EntrenadorBase):
    pass


class Entrenador(EntrenadorBase):
    id_entrenador: int

    class Config:
        from_attributes = True
