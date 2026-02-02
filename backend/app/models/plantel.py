from datetime import date
from typing import Optional

from sqlalchemy import (
    Date,
    Boolean,
    ForeignKey,
    String,
    Text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import AuditFieldsMixin, SoftDeleteMixin


class Plantel(Base, AuditFieldsMixin, SoftDeleteMixin):
    __tablename__ = "plantel"

    id_plantel: Mapped[int] = mapped_column(primary_key=True)

    id_equipo: Mapped[int] = mapped_column(
        ForeignKey("equipo.id_equipo", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )

    # Identificación
    nombre: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    temporada: Mapped[str] = mapped_column(
        String(10),
        nullable=False
    )

    # Descripción
    descripcion: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    # Temporalidad
    fecha_apertura: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

    fecha_cierre: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True
    )

    # Estado
    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    # ======================
    # Relaciones
    # ======================
    equipo = relationship(
        "Equipo",
        back_populates="planteles"
    )

    integrantes = relationship(
        "PlantelIntegrante",
        back_populates="plantel",
        cascade="all, delete-orphan"
    )
