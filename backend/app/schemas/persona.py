from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.enums import GeneroTipo

class PersonaBase(BaseModel):
    documento: Optional[int] = Field(None, gt=0)
    nombre: str = Field(..., min_length=1, max_length=100)
    apellido: str = Field(..., min_length=1, max_length=100)
    fecha_nacimiento: Optional[date] = None
    genero: GeneroTipo

    telefono: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    direccion: Optional[str] = Field(None, max_length=200)

class PersonaCreate(PersonaBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "documento": 34567890,
                "nombre": "Juan",
                "apellido": "Pérez",
                "fecha_nacimiento": "1995-06-12",
                "genero": "Masculino",
                "telefono": "2215551234",
                "email": "juan.perez@mail.com",
                "direccion": "Calle 123",
                "creado_por": "admin"
            }
        }
    )

class PersonaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    apellido: Optional[str] = Field(None, min_length=1, max_length=100)
    fecha_nacimiento: Optional[date] = None
    genero: Optional[GeneroTipo] = None

    telefono: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    direccion: Optional[str] = Field(None, max_length=200)

    actualizado_por: Optional[str] = Field(None, max_length=100)

class Persona(PersonaBase):
    id_persona: int

    creado_en: datetime
    actualizado_en: datetime
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
    
class PersonaRead(PersonaBase):
    id_persona: int
    creado_en: datetime
    actualizado_en: Optional [datetime] = None
    creado_por: Optional[str]
    actualizado_por: Optional[str]

    model_config = ConfigDict(from_attributes=True)