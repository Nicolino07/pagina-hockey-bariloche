from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Esquema base con los campos comunes
class NoticiaBase(BaseModel):
    titulo: str
    imagen_url: Optional[str] = None
    epigrafe: Optional[str] = None
    texto: str

# Lo que recibimos del Administrador al crear
class NoticiaCreate(NoticiaBase):
    creado_por: Optional[str] = None

# Lo que recibimos al actualizar
class NoticiaUpdate(BaseModel):
    titulo: Optional[str] = None
    imagen_url: Optional[str] = None
    epigrafe: Optional[str] = None
    texto: Optional[str] = None
    actualizado_por: Optional[str] = None

# Lo que devolvemos a la web (Home / Detalle)
class NoticiaOut(NoticiaBase):
    id_noticia: int
    creado_en: datetime
    creado_por: Optional[str] = None

    class Config:
        from_attributes = True # Permite mapear modelos de SQLAlchemy