from typing import Optional
from datetime import datetime
from sqlalchemy import (
    String,
    ForeignKey,
    Enum,
    CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from app.models.enums import CategoriaTipo, GeneroTipo
from app.models.mixins import AuditFieldsMixin, SoftDeleteMixin

class Equipo(Base, AuditFieldsMixin, SoftDeleteMixin):
    __tablename__ = "equipo"

    __table_args__ = (
        CheckConstraint("nombre <> ''", name="chk_equipo_nombre_no_vacio"),
    )

    id_equipo: Mapped[int] = mapped_column(primary_key=True)

    nombre: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    id_club: Mapped[int] = mapped_column(
        ForeignKey("club.id_club", ondelete="CASCADE"),
        nullable=False
    )

    categoria: Mapped[CategoriaTipo] = mapped_column(
        Enum(
            CategoriaTipo,
            name="categoria_tipo",
            native_enum=True
        ),
        nullable=False
    )

    genero: Mapped[GeneroTipo] = mapped_column(
        Enum(
            GeneroTipo,
            name="genero_competencia_tipo",
            native_enum=True
        ),
        nullable=False
    )

    # Relaciones
    planteles = relationship(
        "Plantel",
        back_populates="equipo",
        cascade="all, delete-orphan"
    )
    inscripciones = relationship(
        "InscripcionTorneo",
        back_populates="equipo"
    )
