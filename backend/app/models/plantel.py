from datetime import date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, ForeignKey, Date
from app.database import Base
from typing import List

class Plantel(Base):
    __tablename__ = "plantel"

    id_plantel: Mapped[int] = mapped_column(primary_key=True)

    id_equipo: Mapped[int] = mapped_column(
        ForeignKey("equipo.id_equipo"),
        nullable=False
    )

    id_torneo: Mapped[int] = mapped_column(
        ForeignKey("torneo.id_torneo"),
        nullable=False
    )

    fecha_creacion: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    equipo = relationship("Equipo", back_populates="planteles")
    integrantes = relationship("PlantelIntegrante", back_populates="plantel", cascade="all, delete-orphan")
