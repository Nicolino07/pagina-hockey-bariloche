from typing import Optional
from datetime import datetime

from app.models.mixins import AuditFieldsMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import (
    Integer,
    ForeignKey,
    CheckConstraint,
    Enum,
    String,
    Boolean,
    TIMESTAMP
)

from app.models.base import Base
from app.models.enums import EstadoGol, ReferenciaGol


class Gol(Base, AuditFieldsMixin):
    __tablename__ = "gol"

    __table_args__ = (
        CheckConstraint("minuto >= 0", name="chk_gol_minuto_no_negativo"),
        CheckConstraint("cuarto BETWEEN 1 AND 4", name="chk_gol_cuarto_valido"),
    )

    # PK
    id_gol: Mapped[int] = mapped_column(primary_key=True)

    # Relaciones
    id_partido: Mapped[int] = mapped_column(
        ForeignKey("partido.id_partido", ondelete="CASCADE"),
        nullable=False
    )

    id_participante_partido: Mapped[int] = mapped_column(
        ForeignKey("participan_partido.id_participante_partido", ondelete="CASCADE"),
        nullable=False
    )

    # Datos del gol
    minuto: Mapped[Optional[int]] = mapped_column(Integer)
    cuarto: Mapped[Optional[int]] = mapped_column(Integer)

    referencia_gol: Mapped[Optional[ReferenciaGol]] = mapped_column(
        Enum(ReferenciaGol, name="tipo_gol")
    )

    es_autogol: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    estado_gol: Mapped[EstadoGol] = mapped_column(
        Enum(EstadoGol, name="tipo_estado_gol"),
        default=EstadoGol.VALIDO,
        nullable=False
    )

    motivo_anulacion: Mapped[Optional[str]] = mapped_column(String(500))

   

# relaciones
    partido = relationship(
        "Partido",
        back_populates="goles"
    )

    participante_partido = relationship(
        "ParticipanPartido",
        back_populates="goles"
    )

