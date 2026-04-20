from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    Integer,
    String,
    Date,
    TIMESTAMP,
    CheckConstraint,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class FixtureFecha(Base):
    __tablename__ = "fixture_fecha"

    __table_args__ = (
        CheckConstraint(
            "numero_fecha > 0",
            name="chk_fixture_fecha_numero_positivo"
        ),
        CheckConstraint(
            "rueda IN ('ida', 'vuelta')",
            name="chk_fixture_fecha_rueda"
        ),
        UniqueConstraint(
            "id_torneo", "rueda", "numero_fecha",
            name="unq_fixture_fecha"
        ),
    )

    id_fixture_fecha: Mapped[int] = mapped_column(primary_key=True)

    id_torneo: Mapped[int] = mapped_column(
        ForeignKey("torneo.id_torneo", ondelete="CASCADE"),
        nullable=False
    )

    numero_fecha: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    rueda: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="ida"
    )

    fecha_programada: Mapped[Optional[date]] = mapped_column(
        Date
    )

    id_equipo_descansa: Mapped[Optional[int]] = mapped_column(
        ForeignKey("equipo.id_equipo", ondelete="SET NULL"),
        nullable=True
    )

    creado_en: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        default=datetime.utcnow
    )

    creado_por: Mapped[Optional[str]]

    actualizado_en: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP)
    actualizado_por: Mapped[Optional[str]]

    # relaciones
    torneo = relationship("Torneo", backref="fechas_fixture")
    equipo_descansa = relationship("Equipo", foreign_keys=[id_equipo_descansa])
