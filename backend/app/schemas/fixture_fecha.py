from datetime import date, datetime
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict

class FixtureFechaBase(BaseModel):
    id_torneo: int
    numero_fecha: int
    rueda: Literal["ida", "vuelta"] = "ida"
    fecha_programada: Optional[date] = None

class FixtureFechaCreate(FixtureFechaBase):
    creado_por: Optional[str] = None

class FixtureFechaUpdate(BaseModel):
    fecha_programada: Optional[date] = None


class FixtureFechaResponse(FixtureFechaBase):
    id_fixture_fecha: int
    creado_en: datetime
    creado_por: Optional[str]

    model_config = ConfigDict(from_attributes=True)
