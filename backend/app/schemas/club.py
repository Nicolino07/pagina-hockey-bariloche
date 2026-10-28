from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class ClubBase(BaseModel):
    nombre: str
    provincia: Optional[str] = None
    ciudad: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None


class ClubCreate(ClubBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nombre": "Leones FC",
                "provincia": "Buenos Aires",
                "ciudad": "La Plata",
                "direccion": "Calle Falsa 123",
                "telefono": "123456789",
                "email": "info@leonesfc.com",
            }
        }
    )


class ClubUpdate(BaseModel):
    nombre: Optional[str] = None
    provincia: Optional[str] = None
    ciudad: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    actualizado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nombre": "Leones FC Modificado",
                "provincia": "Rio Negro",
                "ciudad": "Bariloche",
                "direccion": "Calle Nueva 456",
                "telefono": "+54-2944895845",
                "email": "nuevo@leonesfc.com"
            }
        }
    )


class Club(ClubBase):
    id_club: int = Field(..., gt=0)
    creado_en: datetime
    actualizado_en: Optional[datetime] = None
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id_club": 1,
                "nombre": "Leones FC",
                "provincia": "Buenos Aires",
                "ciudad": "La Plata",
                "direccion": "Calle Falsa 123",
                "telefono": "123456789",
                "email": "info@leonesfc.com"
            }
        }
    )

class ClubResponse(BaseModel):
    id_club: int
    nombre: str
    creado_en: datetime
    actualizado_en: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }