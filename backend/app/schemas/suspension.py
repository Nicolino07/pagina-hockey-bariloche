from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict, model_validator

from app.models.enums import TipoSuspension, EstadoSuspension, OrigenSuspension, RolPersonaTipo


class SuspensionBase(BaseModel):
    id_persona: int = Field(..., gt=0)
    id_torneo: Optional[int] = Field(None, gt=0)
    id_partido_origen: Optional[int] = None

    # Solo tiene sentido cuando id_torneo es None (alcance global): None = todos
    # los roles, lista explícita = restringe el bloqueo a esos roles.
    roles_afectados: Optional[List[RolPersonaTipo]] = None

    tipo_suspension: TipoSuspension
    motivo: str = Field(..., min_length=1, max_length=500)

    fechas_suspension: Optional[int] = Field(None, gt=0)
    fecha_fin_suspension: Optional[date] = None

    @model_validator(mode="after")
    def _roles_solo_en_alcance_global(self):
        if self.roles_afectados and self.id_torneo is not None:
            raise ValueError(
                "roles_afectados solo aplica a suspensiones de alcance global "
                "(sin id_torneo)."
            )
        return self


class SuspensionCreate(SuspensionBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id_persona": 12,
                "id_torneo": 3,
                "id_partido_origen": 45,
                "tipo_suspension": "POR_PARTIDOS",
                "motivo": "Tarjeta roja directa",
                "fechas_suspension": 2,
                "creado_por": "tribunal_disciplina"
            }
        }
    )


class SuspensionUpdate(BaseModel):
    cumplidas: Optional[int] = Field(None, ge=0)
    partidos_cumplidos: Optional[List[int]] = None
    estado_suspension: Optional[EstadoSuspension] = None
    actualizado_por: Optional[str] = Field(None, max_length=100)


class SuspensionRead(SuspensionBase):
    id_suspension: int

    origen: OrigenSuspension
    id_partido_a_cumplir: Optional[int] = None

    cumplidas: int
    partidos_cumplidos: Optional[List[int]] = None
    estado_suspension: EstadoSuspension

    anulada_en: Optional[datetime] = None
    anulada_por: Optional[str] = None
    motivo_anulacion: Optional[str] = None

    creado_en: datetime
    actualizado_en: Optional[datetime] = None
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
