from datetime import date, datetime, time
from typing import Optional

from sqlalchemy import (
    Integer,
    String,
    Boolean,
    Date,
    Time,
    TIMESTAMP,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class FixturePartido(Base):
    __tablename__ = "fixture_partido"

    __table_args__ = (
        CheckConstraint(
            "id_equipo_local <> id_equipo_visitante",
            name="chk_fixture_partido_equipos_distintos"
        ),
    )

    id_fixture_partido: Mapped[int] = mapped_column(primary_key=True)

    id_fixture_fecha: Mapped[Optional[int]] = mapped_column(
        ForeignKey("fixture_fecha.id_fixture_fecha", ondelete="CASCADE")
    )

    id_torneo: Mapped[int] = mapped_column(
        ForeignKey("torneo.id_torneo", ondelete="CASCADE"),
        nullable=False
    )

    id_equipo_local: Mapped[int] = mapped_column(
        ForeignKey("equipo.id_equipo"),
        nullable=False
    )

    id_equipo_visitante: Mapped[int] = mapped_column(
        ForeignKey("equipo.id_equipo"),
        nullable=False
    )

    numero_fecha: Mapped[Optional[int]] = mapped_column(Integer)
    fecha_programada: Mapped[Optional[date]] = mapped_column(Date)
    horario: Mapped[Optional[time]] = mapped_column(Time)
    ubicacion: Mapped[Optional[str]] = mapped_column(String(200))

    jugado: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    id_partido_real: Mapped[Optional[int]] = mapped_column(
        ForeignKey("partido.id_partido", ondelete="SET NULL")
    )

    creado_en: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        default=datetime.utcnow
    )

    creado_por: Mapped[Optional[str]]

    actualizado_en: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP,
        default=datetime.utcnow
    )

    # Relaciones
    fixture_fecha = relationship("FixtureFecha", backref="partidos_fixture")
    torneo = relationship("Torneo", backref="fixture_partidos")
    equipo_local = relationship("Equipo", foreign_keys=[id_equipo_local])
    equipo_visitante = relationship("Equipo", foreign_keys=[id_equipo_visitante])
    partido_real = relationship("Partido", foreign_keys=[id_partido_real])
