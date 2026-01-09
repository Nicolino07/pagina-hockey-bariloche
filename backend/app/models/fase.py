from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    String,
    Date,
    ForeignKey,
    Integer,
    Enum,
    CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import TipoFase


class Fase(Base):
    __tablename__ = "fase"

    __table_args__ = (
        CheckConstraint("orden >= 1", name="chk_fase_orden_positivo"),
        CheckConstraint(
            "fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio",
            name="chk_fase_fechas_validas"
        ),
    )

    id_fase: Mapped[int] = mapped_column(primary_key=True)

    id_torneo: Mapped[int] = mapped_column(
        ForeignKey("torneo.id_torneo", ondelete="CASCADE"),
        nullable=False
    )

    nombre: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    tipo: Mapped[TipoFase] = mapped_column(
        Enum(
            TipoFase,
            name="tipo_fase",
            native_enum=True
        ),
        nullable=False
    )

    orden: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    fecha_inicio: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    fecha_fin: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
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
    torneo = relationship(
        "Torneo",
        back_populates="fases"
    )
