from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Equipo(Base):
    __tablename__ = "equipo"
    
    id_equipo = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    id_club = Column(Integer, ForeignKey("club.id_club"), nullable=False)
    categoria = Column(String(50), nullable=False)
    genero = Column(String(20), nullable=False)
    
    __table_args__ = (
        CheckConstraint("genero IN ('Masculino','Femenino','Mixto')", name="chk_equipo_genero"),
    )
    
    # ✅ RELACIÓN CORRECTA - Usar cadena y lazy loading
    club = relationship("Club", back_populates="equipos", lazy="select")