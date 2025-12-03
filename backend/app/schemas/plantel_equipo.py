from pydantic import BaseModel
from typing import Optional

class PlantelEquipoBase(BaseModel):
    id_equipo: int
    id_jugador: Optional[int] = None
    id_entrenador: Optional[int] = None
    posicion: Optional[str] = None
    fecha_alta: Optional[str] = None
    fecha_baja: Optional[str] = None


class PlantelEquipoCreate(PlantelEquipoBase):
    pass


class PlantelEquipo(PlantelEquipoBase):
    id_plantel: int

    class Config:
        from_attributes = True
