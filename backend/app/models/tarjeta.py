from datetime import datetime
from typing import Optional

from app.models.mixins import AuditFieldsMixin
from sqlalchemy import Integer, String, ForeignKey, CheckConstraint, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import EstadoTarjeta, TipoTarjeta


class Tarjeta(Base, AuditFieldsMixin):
    __tablename__ = "tarjeta"

    __table_args__ = (
        CheckConstraint("cuarto BETWEEN 1 AND 4", name="chk_tarjeta_cuarto_valido"),
    )

    id_tarjeta: Mapped[int] = mapped_column(primary_key=True)

    id_partido: Mapped[int] = mapped_column(
        ForeignKey("partido.id_partido", ondelete="CASCADE"),
        nullable=False
    )

    id_participante_partido: Mapped[int] = mapped_column(
        ForeignKey("participan_partido.id_participante_partido", ondelete="CASCADE"),
        nullable=False
    )

    tipo: Mapped[TipoTarjeta] = mapped_column(
        Enum(TipoTarjeta, name="tipo_tarjeta"),
        nullable=False
    )

    minuto: Mapped[Optional[int]]
    cuarto: Mapped[Optional[int]]
    observaciones: Mapped[Optional[str]] = mapped_column(String(500))

    estado_tarjeta: Mapped[EstadoTarjeta] = mapped_column(
        Enum(EstadoTarjeta, name="tipo_estado_tarjeta"),
        default=EstadoTarjeta.VALIDA,
        nullable=False
    )

    # Revisión / apelación
    revisada: Mapped[bool] = mapped_column(default=False, nullable=False)
    revisada_por: Mapped[Optional[str]] = mapped_column(String(100))
    revisada_en: Mapped[Optional[datetime]]
    decision_revision: Mapped[Optional[str]] = mapped_column(String(200))


    # Relaciones
    partido = relationship("Partido", back_populates="tarjetas")
    participante_partido = relationship(
        "ParticipanPartido",
        back_populates="tarjetas"
    )

