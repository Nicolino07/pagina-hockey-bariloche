from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Integer,
    Boolean,
    TIMESTAMP,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FixturePartido(Base):
    __tablename__ = "fixture_partido"

    __table_args__ = (
        CheckConstraint(
            "id_equipo_local <> id_equipo_visitante",
            name="chk_fixture_partido_equipos_distintos"
        ),
        UniqueConstraint(
            "id_fixture_fecha",
            "id_equipo_local",
            "id_equipo_visitante",
            name="unq_fixture_partido"
        ),
    )

    id_fixture_partido: Mapped[int] = mapped_column(primary_key=True)

    id_fixture_fecha: Mapped[int] = mapped_column(
        ForeignKey("fixture_fecha.id_fixture_fecha", ondelete="CASCADE"),
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

    # Relaciones útiles
    fixture_fecha = relationship("FixtureFecha", backref="partidos_fixture")
    equipo_local = relationship("Equipo", foreign_keys=[id_equipo_local])
    equipo_visitante = relationship("Equipo", foreign_keys=[id_equipo_visitante])
    partido_real = relationship("Partido", foreign_keys=[id_partido_real])
