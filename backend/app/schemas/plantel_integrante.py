from pydantic import BaseModel
from datetime import date
from typing import Optional

class PlantelIntegranteCreate(BaseModel):
    id_persona: int
    rol_en_plantel: str
    numero_camiseta: Optional[int] = None


class PlantelIntegranteRead(BaseModel):
    id_plantel_integrante: int
    id_persona: int
    rol_en_plantel: str
    numero_camiseta: Optional[int]
    fecha_alta: date
    fecha_baja: Optional[date]

    class Config:
        from_attributes = True
        
class PlantelIntegranteUpdateBaja(BaseModel):
    fecha_baja: date        
    class Config:
        from_attributes = True
