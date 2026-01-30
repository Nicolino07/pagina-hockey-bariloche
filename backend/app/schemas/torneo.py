# app/schemas/torneo.py
from pydantic import BaseModel, Field, validator
from datetime import date, datetime
from typing import Optional
from app.models.enums import CategoriaTipo, GeneroTipo

class TorneoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    categoria: CategoriaTipo
    genero: GeneroTipo
    fecha_inicio: date = Field(default_factory=date.today)
    fecha_fin: Optional[date] = None
    activo: bool = True

    @validator('fecha_fin')
    def validar_fecha_fin(cls, v, values):
        if v and 'fecha_inicio' in values and v <= values['fecha_inicio']:
            raise ValueError('La fecha de fin debe ser posterior a la fecha de inicio')
        return v

class TorneoCreate(TorneoBase):
    pass

class TorneoSchema(TorneoBase):
    id_torneo: int
    creado_en: datetime
    actualizado_en: Optional[datetime] = None
    borrado_en: Optional[datetime] = None
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            CategoriaTipo: lambda v: v.value,
            GeneroTipo: lambda v: v.value
        }

class TorneoFinalizar(BaseModel):
    fecha_fin: Optional[date] = None

class TorneoUpdate(TorneoBase):
    pass