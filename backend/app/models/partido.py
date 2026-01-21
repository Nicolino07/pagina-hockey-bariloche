from datetime import datetime, date, time
from typing import Optional
from app.models.enums import EstadoPartido
from app.models.mixins import AuditFieldsMixin
from sqlalchemy import (
    ForeignKey,
    Integer,
    String,
    Date,
    Time,
    CheckConstraint,
    UniqueConstraint,
    Enum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Partido(Base, AuditFieldsMixin):
    __tablename__ = "partido"

    __table_args__ = (
        CheckConstraint(
            "id_inscripcion_local <> id_inscripcion_visitante",
            name="chk_partido_equipos_distintos"
        ),
        CheckConstraint(
            "id_arbitro1 IS DISTINCT FROM id_arbitro2",
            name="chk_partido_arbitros_distintos"
        ),
        CheckConstraint(
            "id_capitan_local IS DISTINCT FROM id_capitan_visitante",
            name="chk_partido_capitanes_distintos"
        ),
        UniqueConstraint(
            "id_torneo",
            "fecha",
            "id_inscripcion_local",
            "id_inscripcion_visitante",
            name="partido_unq_equipo_fecha"
        ),
    )

    id_partido: Mapped[int] = mapped_column(primary_key=True)

    # Contexto
    id_torneo: Mapped[int] = mapped_column(
        ForeignKey("torneo.id_torneo", ondelete="CASCADE"),
        nullable=False
    )

    id_fase: Mapped[Optional[int]] = mapped_column(
        ForeignKey("fase.id_fase", ondelete="SET NULL")
    )

    fecha: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

    horario: Mapped[Optional[time]] = mapped_column(Time)

    # Equipos
    id_inscripcion_local: Mapped[int] = mapped_column(
        ForeignKey("inscripcion_torneo.id_inscripcion", ondelete="RESTRICT"),
        nullable=False
    )

    id_inscripcion_visitante: Mapped[int] = mapped_column(
        ForeignKey("inscripcion_torneo.id_inscripcion", ondelete="RESTRICT"),
        nullable=False
    )

    # Arbitraje
    id_arbitro1: Mapped[Optional[int]] = mapped_column(
        ForeignKey("persona.id_persona", ondelete="SET NULL")
    )

    id_arbitro2: Mapped[Optional[int]] = mapped_column(
        ForeignKey("persona.id_persona", ondelete="SET NULL")
    )

    # Capitanes
    id_capitan_local: Mapped[Optional[int]] = mapped_column(
        ForeignKey(
            "plantel_integrante.id_plantel_integrante",
            ondelete="SET NULL"
        )
    )

    id_capitan_visitante: Mapped[Optional[int]] = mapped_column(
        ForeignKey(
            "plantel_integrante.id_plantel_integrante",
            ondelete="SET NULL"
        )
    )

    estado_partido: Mapped[EstadoPartido] = mapped_column(
        Enum(
            EstadoPartido,
            name="estado_partido",
            native_enum=True
        ),
        nullable=False
    )

    # Mesa / organización
    juez_mesa_local: Mapped[Optional[str]] = mapped_column(String(100))
    juez_mesa_visitante: Mapped[Optional[str]] = mapped_column(String(100))

    ubicacion: Mapped[Optional[str]] = mapped_column(String(200))
    observaciones: Mapped[Optional[str]] = mapped_column(String(1000))
    numero_fecha: Mapped[Optional[int]] = mapped_column(Integer)

    # Relaciones
    torneo = relationship("Torneo")
    fase = relationship("Fase")

    participantes = relationship(
        "ParticipanPartido",
        back_populates="partido",
        cascade="all, delete-orphan"
    )

    goles = relationship(
        "Gol",
        back_populates="partido",
        cascade="all, delete-orphan"
    )

    tarjetas = relationship(
        "Tarjeta",
        back_populates="partido",
        cascade="all, delete-orphan"
    )
