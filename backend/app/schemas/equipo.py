from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

# IMPORTAR LOS ENUMs
from app.models.enums import CategoriaTipo, GeneroCompetenciaTipo


class EquipoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    id_club: int = Field(..., gt=0)
    categoria: CategoriaTipo  # ENUM
    genero: GeneroCompetenciaTipo  # ENUM


class Equipo(EquipoBase):
    id_equipo: int = Field(..., gt=0)
    creado_en: datetime
    actualizado_en: Optional[datetime] = None   # ✅ FIX
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id_equipo": 1,
                "nombre": "Leones HC",
                "id_club": 1,
                "categoria": "A",
                "genero": "Masculino",
                "creado_en": "2024-01-15T10:30:00",
                "actualizado_en": None,
                "creado_por": "admin",
                "actualizado_por": None
            }
        }
    )

class EquipoCreate(EquipoBase):
    creado_por: Optional[str] = Field(None, max_length=100)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nombre": "Leones HC",
                "id_club": 1,
                "categoria": "A",  # ← Valor del ENUM
                "genero": "MASCULINO",  # ← Valor del ENUM
            }
        }
    )

class EquipoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    categoria: Optional[CategoriaTipo] = None  # ← ENUM opcional
    genero: Optional[GeneroCompetenciaTipo] = None  # ← ENUM opcional
    actualizado_por: Optional[str] = Field(None, max_length=100)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nombre": "Leones HC Modificado",
                "categoria": "B",
                "actualizado_por": "usuario1"
            }
        }
    )

