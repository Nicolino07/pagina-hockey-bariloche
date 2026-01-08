from datetime import datetime, date
from typing import Optional, List

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    Date,
    ForeignKey,
    CheckConstraint,
    Enum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import TipoSuspension


class Suspension(Base):
    __tablename__ = "suspension"

    __table_args__ = (
        CheckConstraint(
            "(tipo_suspension = 'por_partidos' AND fechas_suspension IS NOT NULL) OR "
            "(tipo_suspension = 'por_fecha' AND fecha_fin_suspension IS NOT NULL)",
            name="chk_suspension_tipo_valido"
        ),
        CheckConstraint(
            "cumplidas <= COALESCE(fechas_suspension, 0)",
            name="chk_suspension_cumplidas_validas"
        ),
    )

    id_suspension: Mapped[int] = mapped_column(primary_key=True)

    id_persona: Mapped[int] = mapped_column(
        ForeignKey("persona.id_persona"),
        nullable=False
    )

    id_torneo: Mapped[int] = mapped_column(
        ForeignKey("torneo.id_torneo"),
        nullable=False
    )

    id_partido_origen: Mapped[Optional[int]] = mapped_column(
        ForeignKey("partido.id_partido")
    )

    tipo_suspension: Mapped[TipoSuspension] = mapped_column(
        Enum(TipoSuspension, name="tipo_suspension"),
        nullable=False
    )

    motivo: Mapped[str] = mapped_column(String(500), nullable=False)

    fechas_suspension: Mapped[Optional[int]]
    fecha_fin_suspension: Mapped[Optional[date]]

    cumplidas: Mapped[int] = mapped_column(default=0, nullable=False)

    partidos_cumplidos: Mapped[Optional[List[int]]] = mapped_column(
        nullable=True
    )

    activa: Mapped[bool] = mapped_column(default=True, nullable=False)

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

    # Relaciones
    persona = relationship("Persona")
    torneo = relationship("Torneo")
    partido_origen = relationship("Partido")

