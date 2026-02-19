from datetime import datetime
from typing import Optional

from app.models.mixins import AuditFieldsMixin
from sqlalchemy import (
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class ParticipanPartido(Base, AuditFieldsMixin):
    __tablename__ = "participan_partido"

    __table_args__ = (
        UniqueConstraint(
            "id_partido",
            "id_plantel_integrante",
            name="unq_jugador_partido"
        ),
        CheckConstraint(
            "numero_camiseta > 0",
            name="chk_participan_partido_numero_camiseta_valido"
        ),
    )

    id_participante_partido: Mapped[int] = mapped_column(primary_key=True)

    id_partido: Mapped[int] = mapped_column(
        ForeignKey("partido.id_partido", ondelete="CASCADE"),
        nullable=False
    )

    id_plantel_integrante: Mapped[int] = mapped_column(
        ForeignKey(
            "plantel_integrante.id_plantel_integrante",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    numero_camiseta: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)


    # Relaciones (muy útiles)
    partido = relationship("Partido", back_populates="participantes")
    plantel_integrante = relationship("PlantelIntegrante")

    # Relaciones inversas
    goles = relationship(
        "Gol",
        back_populates="participante_partido",
        cascade="all, delete-orphan"
    )

    tarjetas = relationship(
        "Tarjeta",
        back_populates="participante_partido",
        cascade="all, delete-orphan"
    )
