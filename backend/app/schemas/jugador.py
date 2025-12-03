from pydantic import BaseModel
from typing import Optional


class JugadorBase(BaseModel):
    dni: Optional[str] = None
    nombre: str
    apellido: Optional[str] = None
    genero: str
    fecha_nacimiento: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None


class JugadorCreate(JugadorBase):
    pass


class Jugador(JugadorBase):
    id_jugador: int

    class Config:
        from_attributes = True
