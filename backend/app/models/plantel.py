from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Plantel(Base):
    __tablename__ = "plantel"

    id_plantel: Mapped[int] = mapped_column(primary_key=True)

    id_equipo: Mapped[int] = mapped_column(
        ForeignKey("equipo.id_equipo", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )

    fecha_creacion: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    # Auditoría
    creado_en: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        nullable=False
    )

    actualizado_en: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    creado_por: Mapped[Optional[str]] = mapped_column()
    actualizado_por: Mapped[Optional[str]] = mapped_column()

    # Relaciones
    equipo = relationship("Equipo", backref="planteles")
    integrantes = relationship(
        "PlantelIntegrante",
        back_populates="plantel",
        cascade="all, delete-orphan"
    )
