from datetime import date, datetime
from typing import Optional

from app.models.mixins import AuditFieldsMixin, SoftDeleteMixin
from sqlalchemy import Date, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Plantel(Base, AuditFieldsMixin, SoftDeleteMixin):
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

    # Relaciones
    equipo = relationship(
        "Equipo",
        back_populates="planteles"
    )

    integrantes = relationship(
        "PlantelIntegrante",
        back_populates="plantel",
        cascade="all, delete-orphan"
    )
