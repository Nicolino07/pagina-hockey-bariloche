from datetime import datetime
from typing import Optional

from app.models.mixins import AuditFieldsMixin
from sqlalchemy import Integer, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Posicion(Base, AuditFieldsMixin):
    __tablename__ = "posicion"

    __table_args__ = (
        CheckConstraint("puntos >= 0", name="chk_posicion_puntos"),
        CheckConstraint("partidos_jugados >= 0", name="chk_posicion_pj"),
        CheckConstraint("ganados >= 0", name="chk_posicion_ganados"),
        CheckConstraint("empatados >= 0", name="chk_posicion_empatados"),
        CheckConstraint("perdidos >= 0", name="chk_posicion_perdidos"),
        CheckConstraint("goles_a_favor >= 0", name="chk_posicion_gf"),
        CheckConstraint("goles_en_contra >= 0", name="chk_posicion_gc"),
    )

    id_posicion: Mapped[int] = mapped_column(primary_key=True)

    id_torneo: Mapped[int] = mapped_column(
        ForeignKey("torneo.id_torneo"),
        nullable=False
    )

    id_equipo: Mapped[int] = mapped_column(
        ForeignKey("equipo.id_equipo"),
        nullable=False
    )

    # Estadísticas
    puntos: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    partidos_jugados: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ganados: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    empatados: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    perdidos: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    goles_a_favor: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    goles_en_contra: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Campo calculado (GENERATED ALWAYS)
    diferencia_gol: Mapped[int]


    # Relaciones
    torneo = relationship("Torneo")
    equipo = relationship("Equipo")
