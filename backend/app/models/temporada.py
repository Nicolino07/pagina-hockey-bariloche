from datetime import datetime
from typing import Optional

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    Enum,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import AuditFieldsMixin, SoftDeleteMixin
from app.models.enums import CategoriaTipo, GeneroTipo


class Temporada(Base, AuditFieldsMixin, SoftDeleteMixin):
    """Agrupación anual de torneos de una misma liga (Apertura + Clausura).

    Una temporada identifica una liga en un año: categoría, división y género.
    Los torneos que le pertenecen declaran su papel en `torneo.rol_en_temporada`
    (ver `RolTorneoTemporada`), que decide cuáles suman a la tabla anual.

    Es un eje distinto de `torneo.torneo_base_id`: ese vincula un playoff con la
    liga de la que hereda nómina e inscripciones; este dice a qué año pertenece
    un torneo y si computa para el campeonato anual.
    """

    __tablename__ = "temporada"

    __table_args__ = (
        CheckConstraint("nombre <> ''", name="chk_temporada_nombre_no_vacio"),
        CheckConstraint("anio BETWEEN 1900 AND 2200", name="chk_temporada_anio"),
    )

    id_temporada: Mapped[int] = mapped_column(primary_key=True)

    nombre: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    anio: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    categoria: Mapped[CategoriaTipo] = mapped_column(
        Enum(CategoriaTipo, name="tipo_categoria"),
        nullable=False
    )

    division: Mapped[Optional[str]] = mapped_column(
        String(30),
        nullable=True,
        default=None
    )

    genero: Mapped[GeneroTipo] = mapped_column(
        Enum(GeneroTipo, name="tipo_genero"),
        nullable=False
    )

    activa: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False
    )

    # Relaciones
    torneos = relationship("Torneo", back_populates="temporada")
