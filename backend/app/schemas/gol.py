from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.models.enums import ReferenciaGol


class GolBase(BaseModel):
    id_partido: int
    id_participante_partido: int
    minuto: Optional[int] = None
    cuarto: Optional[int] = None
    referencia_gol: Optional[ReferenciaGol] = None
    es_autogol: bool = False

class GolCreate(GolBase):
    creado_por: Optional[str] = None

class GolUpdate(BaseModel):
    minuto: Optional[int] = None
    cuarto: Optional[int] = None
    referencia_gol: Optional[ReferenciaGol] = None
    es_autogol: Optional[bool] = None
    actualizado_por: Optional[str] = None
    
class Gol(GolBase):
    id_gol: int

    # Estado
    anulado: bool
    anulado_por: Optional[str] = None
    anulado_en: Optional[datetime] = None
    motivo_anulacion: Optional[str] = None

    # Auditoría
    creado_en: datetime
    actualizado_en: Optional [datetime] = None
    creado_por: Optional[str] = None
    actualizado_por: Optional[str] = None

    class Config:
        from_attributes = True
