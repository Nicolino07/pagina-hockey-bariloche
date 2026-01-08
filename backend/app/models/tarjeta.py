from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, String, ForeignKey, CheckConstraint, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import TipoTarjeta


class Tarjeta(Base):
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

    # Revisión / apelación
    revisada: Mapped[bool] = mapped_column(default=False, nullable=False)
    revisada_por: Mapped[Optional[str]] = mapped_column(String(100))
    revisada_en: Mapped[Optional[datetime]]
    decision_revision: Mapped[Optional[str]] = mapped_column(String(200))

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
    partido = relationship("Partido")
    participante_partido = relationship("ParticipanPartido")
