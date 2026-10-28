from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.enums import TipoTarjeta

class TarjetaBase(BaseModel):
    id_partido: int = Field(..., gt=0)
    id_participante_partido: int = Field(..., gt=0)
    tipo: TipoTarjeta
    minuto: Optional[int] = Field(None, ge=0)
    cuarto: Optional[int] = Field(None, ge=1, le=4)
    observaciones: Optional[str] = Field(None, max_length=500)

class TarjetaCreate(TarjetaBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id_partido": 10,
                "id_participante_partido": 55,
                "tipo": "amarilla",
                "minuto": 23,
                "cuarto": 2,
                "observaciones": "Falta reiterada",
                "creado_por": "arbitro_principal"
            }
        }
    )

class TarjetaUpdate(BaseModel):
    revisada: Optional[bool] = None
    revisada_por: Optional[str] = Field(None, max_length=100)
    decision_revision: Optional[str] = Field(None, max_length=200)
    actualizado_por: Optional[str] = Field(None, max_length=100)

class Tarjeta(TarjetaBase):
    id_tarjeta: int

    revisada: bool
    revisada_por: Optional[str] = None
    revisada_en: Optional[datetime] = None
    decision_revision: Optional[str] = None

    creado_en: datetime
    actualizado_en: Optional [datetime] = None
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

