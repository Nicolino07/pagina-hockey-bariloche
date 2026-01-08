from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date

from app.models.enums import TipoFase


class FaseBase(BaseModel):
    torneo_id: int = Field(..., gt=0)
    nombre: str = Field(..., min_length=1, max_length=50)
    tipo: TipoFase
    orden: Optional[int] = Field(None, ge=1)
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None


class FaseCreate(FaseBase):
    pass


class FaseUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=50)
    tipo: Optional[TipoFase] = None
    orden: Optional[int] = Field(None, ge=1)
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None


class Fase(FaseBase):
    id_fase: int

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id_fase": 1,
                "torneo_id": 3,
                "nombre": "Fase Regular",
                "tipo": "liga",
                "orden": 1,
                "fecha_inicio": "2024-03-01",
                "fecha_fin": "2024-05-30"
            }
        }
    )
