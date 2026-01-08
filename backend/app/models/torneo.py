from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    String,
    Boolean,
    Date,
    CheckConstraint,
    Enum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import CategoriaTipo, GeneroCompetenciaTipo


class Torneo(Base):
    __tablename__ = "torneo"

    __table_args__ = (
        CheckConstraint(
            "fecha_fin IS NULL OR fecha_fin > fecha_inicio",
            name="chk_torneo_fechas_validas"
        ),
        CheckConstraint(
            "nombre <> ''",
            name="chk_torneo_nombre_no_vacio"
        ),
    )

    id_torneo: Mapped[int] = mapped_column(primary_key=True)

    nombre: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    categoria: Mapped[CategoriaTipo] = mapped_column(
        Enum(CategoriaTipo, name="tipo_categoria"),
        nullable=False
    )

    genero: Mapped[GeneroCompetenciaTipo] = mapped_column(
        Enum(GeneroCompetenciaTipo, name="tipo_genero_competencia"),
        nullable=False
    )

    fecha_inicio: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

    fecha_fin: Mapped[Optional[date]]

    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
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

    # Relaciones
    fases = relationship("Fase", back_populates="torneo")
    inscripciones = relationship("InscripcionTorneo", back_populates="torneo")
    partidos = relationship("Partido", back_populates="torneo")
    posiciones = relationship("Posicion", back_populates="torneo")
