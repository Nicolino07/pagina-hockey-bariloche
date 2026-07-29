from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# ======================
# Base
# ======================
class PlantelBase(BaseModel):
    id_equipo: int = Field(..., gt=0)
    # Torneo de la nómina. None solo para los planteles históricos previos a la
    # migración 0033; los nuevos deberían crearse siempre con torneo.
    id_torneo: Optional[int] = Field(None, gt=0)
    # Opcionales: se derivan del torneo cuando viene id_torneo.
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    temporada: Optional[str] = Field(None, max_length=10)
    descripcion: Optional[str] = None

    fecha_apertura: Optional[date] = None
    fecha_cierre: Optional[date] = None

    activo: bool = True


# ======================
# Create
# ======================
class PlantelCreate(PlantelBase):
    creado_por: Optional[str] = Field(None, max_length=100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id_equipo": 5,
                "id_torneo": 17,
                "descripcion": "Nómina para el torneo",
                "creado_por": "admin"
            }
        }
    )


# ======================
# Copiar plantel de un torneo a otro
# ======================
class PlantelCopiar(BaseModel):
    """Copia la nómina de un plantel hacia otro plantel del mismo equipo.

    Se indica el destino de una de dos formas: un plantel que ya existe
    (para llenarlo de golpe y después ajustarlo) o un torneo, creando el
    plantel en el acto.
    """
    id_plantel_origen: int = Field(..., gt=0)
    id_plantel_destino: Optional[int] = Field(None, gt=0)
    id_torneo_destino: Optional[int] = Field(None, gt=0)


class PlantelCopiaOmitido(BaseModel):
    id_persona: int
    nombre: str
    motivo: str


class PlantelCopiaResultado(BaseModel):
    id_plantel_destino: int
    copiados: int
    omitidos: list[PlantelCopiaOmitido] = []


# ======================
# Update
# ======================
class PlantelUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    temporada: Optional[str] = Field(None, max_length=10)
    descripcion: Optional[str] = None

    fecha_apertura: Optional[date] = None
    fecha_cierre: Optional[date] = None
    activo: Optional[bool] = None

    actualizado_por: Optional[str] = Field(None, max_length=100)


# ======================
# Read
# ======================
class PlantelRead(PlantelBase):
    id_plantel: int

    creado_en: datetime
    actualizado_en: Optional[datetime] = None
    borrado_en: Optional[datetime] = None

    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
