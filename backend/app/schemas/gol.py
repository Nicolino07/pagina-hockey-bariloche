from pydantic import BaseModel
from typing import Optional

class GolBase(BaseModel):
    id_partido: int
    id_participante_partido: int
    minuto: Optional[int] = None
    cuarto: Optional[int] = None
    es_autogol: Optional[bool] = False


class GolCreate(GolBase):
    pass


class Gol(GolBase):
    id_gol: int

    class Config:
        from_attributes = True
