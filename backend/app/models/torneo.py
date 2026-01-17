from datetime import datetime, date
from typing import Optional

from app.models.mixins import AuditFieldsMixin, SoftDeleteMixin
from sqlalchemy import (
    String,
    Boolean,
    Date,
    CheckConstraint,
    Enum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.enums import CategoriaTipo, GeneroTipo


class Torneo(Base, AuditFieldsMixin, SoftDeleteMixin):
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

    genero: Mapped[GeneroTipo] = mapped_column(
        Enum(GeneroTipo, name="tipo_genero_competencia"),
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


    # Relaciones
    fases = relationship("Fase", back_populates="torneo")
    inscripciones = relationship("InscripcionTorneo", back_populates="torneo")
    partidos = relationship("Partido", back_populates="torneo")
    posiciones = relationship("Posicion", back_populates="torneo")
