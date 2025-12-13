from pydantic import BaseModel
from typing import Optional
import datetime


# ======================
# Plantel
# ======================

class PlantelBase(BaseModel):
    id_equipo: int
    temporada: Optional[str] = None


class PlantelCreate(PlantelBase):
    pass


class PlantelResponse(PlantelBase):
    id_plantel: int
    fecha_creacion: Optional[datetime.date] = None  # <-- CAMBIO IMPORTANTE

    class Config:
        orm_mode = True


# ======================
# Plantel Integrante
# ======================

class PlantelIntegranteBase(BaseModel):
    id_plantel: int
    id_jugador: Optional[int] = None
    id_entrenador: Optional[int] = None
    rol: str
    numero_camiseta: Optional[int] = None
    fecha_baja: Optional[datetime.date] = None


class PlantelIntegranteCreate(PlantelIntegranteBase):
    pass


class PlantelIntegranteResponse(PlantelIntegranteBase):
    id_plantel_integrante: int
    fecha_alta: Optional[datetime.date] = None  # Para evitar errores similares

    class Config:
        orm_mode = True
