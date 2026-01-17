from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

class ParticipanPartidoBase(BaseModel):
    id_partido: int = Field(..., gt=0)
    id_plantel_integrante: int = Field(..., gt=0)
    numero_camiseta: Optional[int] = Field(None, gt=0)

class ParticipanPartidoCreate(ParticipanPartidoBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id_partido": 12,
                "id_plantel_integrante": 45,
                "numero_camiseta": 9,
                "creado_por": "admin"
            }
        }
    )

class ParticipanPartidoUpdate(BaseModel):
    numero_camiseta: Optional[int] = Field(None, gt=0)
    actualizado_por: Optional[str] = Field(None, max_length=100)

class ParticipanPartido(ParticipanPartidoBase):
    id_participante_partido: int

    creado_en: datetime
    actualizado_en: Optional [datetime] = None
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id_participante_partido": 100,
                "id_partido": 12,
                "id_plantel_integrante": 45,
                "numero_camiseta": 9,
                "creado_en": "2026-01-07T10:15:00",
                "actualizado_en": "2026-01-07T10:15:00",
                "creado_por": "admin",
                "actualizado_por": None
            }
        }
    )
