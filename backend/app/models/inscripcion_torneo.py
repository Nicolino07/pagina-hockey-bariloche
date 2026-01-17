from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    ForeignKey,
    Date,
    String,
    UniqueConstraint,
    Enum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import GeneroTipo
from app.models.mixins import AuditFieldsMixin, SoftDeleteMixin

class InscripcionTorneo(Base, AuditFieldsMixin, SoftDeleteMixin):
    __tablename__ = "inscripcion_torneo"

    __table_args__ = (
        UniqueConstraint(
            "id_equipo",
            "id_torneo",
            name="unq_equipo_torneo"
        ),
    )

    id_inscripcion: Mapped[int] = mapped_column(primary_key=True)

    id_equipo: Mapped[int] = mapped_column(
        ForeignKey("equipo.id_equipo", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )

    id_torneo: Mapped[int] = mapped_column(
        ForeignKey("torneo.id_torneo", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )


    fecha_inscripcion: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

    # Relaciones (opcionales, pero recomendadas)
    equipo = relationship(
        "Equipo",
        back_populates="inscripciones"
    )

    torneo = relationship("Torneo")
