# backend/app/models/torneo.py
from datetime import datetime, date
from typing import Optional

from app.models.mixins import AuditFieldsMixin, SoftDeleteMixin
from sqlalchemy import (
    String,
    Boolean,
    Date,
    CheckConstraint,
    Enum,
    ForeignKey,
)

from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from app.models.base import Base
from app.models.enums import CategoriaTipo, GeneroTipo, TipoTorneo, RolTorneoTemporada


class Torneo(Base, AuditFieldsMixin, SoftDeleteMixin):
    __tablename__ = "torneo"

    __table_args__ = (
        CheckConstraint(
            "fecha_fin IS NULL OR fecha_fin >= fecha_inicio",
            name="chk_torneo_fechas_validas"
        ),
        CheckConstraint(
            "nombre <> ''",
            name="chk_torneo_nombre_no_vacio"
        ),
        CheckConstraint(
            "rol_en_temporada IS NULL OR id_temporada IS NOT NULL",
            name="chk_torneo_rol_requiere_temporada"
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

    division: Mapped[Optional[str]] = mapped_column(
        String(30),
        nullable=True,
        default=None
    )

    genero: Mapped[GeneroTipo] = mapped_column(
        Enum(GeneroTipo, name="tipo_genero"),
        nullable=False
    )

    fecha_inicio: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

    fecha_fin: Mapped[Optional[date]]

    tipo: Mapped[TipoTorneo] = mapped_column(
        Enum(TipoTorneo, name="tipo_torneo"),
        nullable=False,
        default=TipoTorneo.LIGA,
        server_default="LIGA",
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    # Marca si el torneo aplica la Regla 1 de designación de árbitros
    # (bloquea árbitros con rol activo en un club del partido).
    es_competitiva: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False
    )

    torneo_base_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("torneo.id_torneo", ondelete="SET NULL"),
        nullable=True,
        default=None
    )

    # Agrupación anual. Eje separado de torneo_base_id: ese vincula un playoff
    # con la liga de la que hereda la nómina; este dice a qué año pertenece el
    # torneo y, vía rol_en_temporada, si suma a la tabla anual.
    id_temporada: Mapped[Optional[int]] = mapped_column(
        ForeignKey("temporada.id_temporada", ondelete="SET NULL"),
        nullable=True,
        default=None
    )

    rol_en_temporada: Mapped[Optional[RolTorneoTemporada]] = mapped_column(
        Enum(RolTorneoTemporada, name="rol_torneo_temporada"),
        nullable=True,
        default=None
    )

    # Relaciones
    fases = relationship("Fase", back_populates="torneo")
    inscripciones = relationship("InscripcionTorneo", back_populates="torneo")
    partidos = relationship("Partido", back_populates="torneo")
    posiciones = relationship("Posicion", back_populates="torneo")
    temporada = relationship("Temporada", back_populates="torneos")

    @property
    def computa_anual(self) -> bool:
        """Si este torneo suma a la tabla anual de su temporada.

        Es lo que refleja el check del alta. Se deriva del rol en vez de vivir en
        una columna propia para que no puedan quedar desincronizados: la vista
        `vw_tabla_posiciones_anual` filtra por `rol_en_temporada = 'REGULAR'`,
        así que ese es el único dato que decide de verdad.
        """
        return self.rol_en_temporada == RolTorneoTemporada.REGULAR
