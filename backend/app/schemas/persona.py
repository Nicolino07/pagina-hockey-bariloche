from pydantic import BaseModel
from datetime import date
from typing import Optional

class PersonaBase(BaseModel):
    dni: Optional[int]
    nombre: str
    apellido: str
    fecha_nacimiento: Optional[date]
    genero: Optional[str] # 'Masculino', 'Femenino', 'Otro'
    telefono: Optional[str]
    email: Optional[str]
    direccion: Optional[str]

class PersonaCreate(PersonaBase):
    pass

class PersonaRead(PersonaBase):
    id_persona: int

    class Config:
        from_attributes = True
