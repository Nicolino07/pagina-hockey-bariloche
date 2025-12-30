from datetime import date
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, ForeignKey, Date, String
from app.database import Base

class PlantelIntegrante(Base):
    __tablename__ = "plantel_integrante"

    id_plantel_integrante: Mapped[int] = mapped_column(primary_key=True)
    id_plantel: Mapped[int] = mapped_column(ForeignKey("plantel.id_plantel"),nullable=False)
    id_persona: Mapped[int] = mapped_column(ForeignKey("persona.id_persona"),nullable=False)
    rol_en_plantel: Mapped[str] = mapped_column(String(20), nullable=False)
    numero_camiseta: Mapped[Optional[int]]
    fecha_alta: Mapped[date] = mapped_column(Date,nullable=False)
    fecha_baja: Mapped[Optional[date]]

    plantel = relationship("Plantel", back_populates="integrantes")
    persona = relationship("Persona", back_populates="planteles")

