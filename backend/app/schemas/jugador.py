from pydantic import BaseModel
from typing import Optional
from datetime import date


class JugadorBase(BaseModel):
    dni: Optional[str] = None
    nombre: str
    apellido: Optional[str] = None
    genero: str
    fecha_nacimiento: Optional[date] = None
    telefono: Optional[str] = None
    email: Optional[str] = None


class JugadorCreate(JugadorBase):
    pass

class JugadorUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    dni: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    id_equipo: Optional[int] = None
    numero_camiseta: Optional[int] = None
    posicion: Optional[str] = None


class Jugador(JugadorBase):
    id_jugador: int

    class Config:
        from_attributes = True
