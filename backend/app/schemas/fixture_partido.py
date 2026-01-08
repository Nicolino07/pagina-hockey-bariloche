from typing import Optional
from pydantic import BaseModel

class FixturePartidoBase(BaseModel):
    id_fixture_fecha: int
    id_equipo_local: int
    id_equipo_visitante: int

class FixturePartidoCreate(FixturePartidoBase):
    creado_por: Optional[str] = None

class FixturePartidoUpdate(BaseModel):
    jugado: Optional[bool] = None
    id_partido_real: Optional[int] = None

from datetime import datetime
from pydantic import ConfigDict


class FixturePartidoResponse(FixturePartidoBase):
    id_fixture_partido: int
    jugado: bool
    id_partido_real: Optional[int]
    creado_en: datetime
    creado_por: Optional[str]

    model_config = ConfigDict(from_attributes=True)
