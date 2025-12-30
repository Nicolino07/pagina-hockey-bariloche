from pydantic import BaseModel
from datetime import date
from typing import List
from .plantel_integrante import PlantelIntegranteRead

class PlantelCreate(BaseModel):
    id_equipo: int
    id_torneo: int


class PlantelRead(BaseModel):
    id_plantel: int
    id_equipo: int
    id_torneo: int
    fecha_creacion: date
    integrantes: List[PlantelIntegranteRead] = []

    class Config:
        from_attributes = True


