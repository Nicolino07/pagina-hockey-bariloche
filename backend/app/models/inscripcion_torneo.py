from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    ForeignKey,
    Date,
    String,
    UniqueConstraint,
    Enum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import GeneroCompetenciaTipo


class InscripcionTorneo(Base):
    __tablename__ = "inscripcion_torneo"

    __table_args__ = (
        UniqueConstraint(
            "id_equipo",
            "id_torneo",
            name="unq_equipo_torneo"
        ),
    )

    id_inscripcion: Mapped[int] = mapped_column(primary_key=True)

    id_equipo: Mapped[int] = mapped_column(
        ForeignKey("equipo.id_equipo", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )

    id_torneo: Mapped[int] = mapped_column(
        ForeignKey("torneo.id_torneo", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )

    genero: Mapped[GeneroCompetenciaTipo] = mapped_column(
        Enum(GeneroCompetenciaTipo, name="tipo_genero_competencia"),
        nullable=False
    )

    fecha_inscripcion: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

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

    # Relaciones (opcionales, pero recomendadas)
    equipo = relationship("Equipo")
    torneo = relationship("Torneo")
