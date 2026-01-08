from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    Integer,
    ForeignKey,
    CheckConstraint,
    Enum,
    String,
    Boolean,
    TIMESTAMP
)

from app.database import Base
from app.models.enums import ReferenciaGol


class Gol(Base):
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

    # Anulación (VAR / correcciones)
    anulado: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    anulado_por: Mapped[Optional[str]] = mapped_column(String(100))
    anulado_en: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP)
    motivo_anulacion: Mapped[Optional[str]] = mapped_column(String(500))

    # Auditoría
    creado_en: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        default=datetime.utcnow,
        nullable=False
    )

    actualizado_en: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    creado_por: Mapped[Optional[str]] = mapped_column(String(100))
    actualizado_por: Mapped[Optional[str]] = mapped_column(String(100))
