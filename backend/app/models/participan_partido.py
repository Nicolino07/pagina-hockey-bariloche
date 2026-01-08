from datetime import datetime
from typing import Optional

from sqlalchemy import (
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ParticipanPartido(Base):
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

    numero_camiseta: Mapped[Optional[int]] = mapped_column(Integer)

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

    creado_por: Mapped[Optional[str]] = mapped_column(String(100))
    actualizado_por: Mapped[Optional[str]] = mapped_column(String(100))

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
