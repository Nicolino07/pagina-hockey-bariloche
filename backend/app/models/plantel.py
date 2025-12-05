from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

"""Modelos para la gestión de planteles"""
class Plantel(Base):
    __tablename__ = "plantel"

    id_plantel = Column(Integer, primary_key=True, index=True)
    id_equipo = Column(Integer, ForeignKey("equipo.id_equipo", ondelete="CASCADE"), nullable=False)
    temporada = Column(String(20))
    fecha_creacion = Column(Date, nullable=False, server_default=func.current_date())

    equipo = relationship("Equipo", back_populates="planteles")
    integrantes = relationship("PlantelIntegrante", back_populates="plantel", cascade="all, delete")



class PlantelIntegrante(Base):
    """Modelo para los integrantes del plantel (jugadores y entrenadores)"""

    __tablename__ = "plantel_integrante"

    id_plantel_integrante = Column(Integer, primary_key=True, index=True)
    id_plantel = Column(Integer, ForeignKey("plantel.id_plantel", ondelete="CASCADE"), nullable=False)
    id_jugador = Column(Integer, ForeignKey("jugador.id_jugador"))
    id_entrenador = Column(Integer, ForeignKey("entrenador.id_entrenador"))
    rol = Column(String(50), nullable=False)
    numero_camiseta = Column(Integer)
    fecha_alta = Column(Date, nullable=False, server_default=func.current_date())
    fecha_baja = Column(Date)

    plantel = relationship("Plantel", back_populates="integrantes")
    jugador = relationship("Jugador")
    entrenador = relationship("Entrenador")
