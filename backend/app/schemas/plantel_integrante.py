from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import RolPersonaTipo


class PlantelIntegranteBase(BaseModel):
    id_plantel: int = Field(..., gt=0)
    id_persona: int = Field(..., gt=0)
    rol_en_plantel: RolPersonaTipo
    numero_camiseta: Optional[int] = Field(None, gt=0)
    fecha_alta: Optional[date] = None
    fecha_baja: Optional[date] = None


class PlantelIntegranteCreate(BaseModel):
    id_plantel: int = Field(..., gt=0)
    id_persona: int = Field(..., gt=0)
    rol_en_plantel: RolPersonaTipo
    numero_camiseta: Optional[int] = Field(None, gt=0)
    creado_por: Optional[str] = Field(None, max_length=100)


class PlantelIntegranteUpdate(BaseModel):
    rol_en_plantel: Optional[RolPersonaTipo] = None
    numero_camiseta: Optional[int] = Field(None, gt=0)
    fecha_baja: Optional[date] = None
    actualizado_por: Optional[str] = Field(None, max_length=100)


class PlantelIntegranteRead(PlantelIntegranteBase):
    id_plantel_integrante: int

    creado_en: datetime
    actualizado_en: Optional [datetime] = None
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
