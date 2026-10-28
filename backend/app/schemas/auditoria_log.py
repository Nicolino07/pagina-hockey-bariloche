from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict

## solo de lectura
class AuditoriaLog(BaseModel):
    id_log: int
    tabla_afectada: str
    id_registro: Optional[str]
    operacion: str

    valores_anteriores: Optional[dict[str, Any]]
    valores_nuevos: Optional[dict[str, Any]]

    usuario: Optional[str]
    fecha_hora: datetime
    ip_address: Optional[str]
    user_agent: Optional[str]

    model_config = ConfigDict(from_attributes=True)
