"""
Penales de la tanda que define un cruce eliminatorio.

Deliberadamente NO son goles. Un penal de la tanda no suma al marcador, no
cuenta para el ranking de goleadores ni para goles a favor / en contra: su único
efecto es decidir quién pasa de ronda. Por eso vive en su propia tabla y no como
una etiqueta dentro de `gol`.
"""
from typing import Optional
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    String,
    TIMESTAMP,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class PenalDefinicion(Base):
    __tablename__ = "penal_definicion"

    __table_args__ = (
        CheckConstraint("orden IS NULL OR orden > 0", name="chk_penal_orden_positivo"),
    )

    id_penal_definicion: Mapped[int] = mapped_column(primary_key=True)

    id_partido: Mapped[int] = mapped_column(
        ForeignKey("partido.id_partido", ondelete="CASCADE"),
        nullable=False,
    )

    #: El ejecutante, a través de la convocatoria de ESTE partido (no del club
    #: ni del plantel general).
    id_participante_partido: Mapped[int] = mapped_column(
        ForeignKey("participan_partido.id_participante_partido", ondelete="CASCADE"),
        nullable=False,
    )

    #: El lado, por inscripción al torneo. Nunca por club: si se enfrentan dos
    #: equipos del mismo club, comparar por club da verdadero para los dos lados
    #: y los penales se cuentan doble.
    id_inscripcion: Mapped[int] = mapped_column(
        ForeignKey("inscripcion_torneo.id_inscripcion", ondelete="CASCADE"),
        nullable=False,
    )

    #: Orden de ejecución dentro de la serie. Permite reconstruir la tanda.
    orden: Mapped[Optional[int]] = mapped_column(Integer)

    convertido: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    creado_en: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp()
    )
    actualizado_en: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP)
    creado_por: Mapped[Optional[str]] = mapped_column(String(100))
    actualizado_por: Mapped[Optional[str]] = mapped_column(String(100))

    partido = relationship("Partido", back_populates="penales")
    participante_partido = relationship("ParticipanPartido", back_populates="penales")
