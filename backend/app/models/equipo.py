from typing import Optional
from datetime import datetime

from sqlalchemy import String, ForeignKey, Enum, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import CategoriaTipo, GeneroCompetenciaTipo


class Equipo(Base):
    __tablename__ = "equipo"

    __table_args__ = (
        CheckConstraint("nombre <> ''", name="chk_equipo_nombre_no_vacio"),
    )

    id_equipo: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)

    id_club: Mapped[int] = mapped_column(
        ForeignKey("club.id_club", ondelete="CASCADE"),
        nullable=False
    )

    categoria: Mapped[CategoriaTipo] = mapped_column(
        Enum(CategoriaTipo, name="categoria_tipo"),
        nullable=False
    )

    genero: Mapped[GeneroCompetenciaTipo] = mapped_column(
        Enum(GeneroCompetenciaTipo, name="genero_competencia_tipo"),
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
    planteles = relationship("Plantel", back_populates="equipo")
