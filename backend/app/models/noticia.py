from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func
from app.models.base import Base

class Noticia(Base):
    __tablename__ = "noticias"

    id_noticia = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False)
    imagen_url = Column(Text, nullable=True)
    epigrafe = Column(String(255), nullable=True)
    texto = Column(Text, nullable=False)
    
    # Auditoría y Soft Delete
    creado_en = Column(TIMESTAMP, server_default=func.now())
    actualizado_en = Column(TIMESTAMP, onupdate=func.now(), nullable=True)
    borrado_en = Column(TIMESTAMP, nullable=True)
    creado_por = Column(String(100), nullable=True)
    actualizado_por = Column(String(100), nullable=True)