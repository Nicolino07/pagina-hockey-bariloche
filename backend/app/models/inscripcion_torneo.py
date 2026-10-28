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

from app.models.base import Base


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

    id_torneo: Mapped[int] = mapped_column( ForeignKey("torneo.id_torneo", onupdate="CASCADE",
                                                        ondelete="RESTRICT"), nullable=False)
    
    fecha_inscripcion: Mapped[date] = mapped_column( Date, default=date.today, nullable=False)
    
    fecha_baja: Mapped[Optional[date]]

    # --- AÑADE ESTOS CAMPOS ---
    creado_en: Mapped[datetime] = mapped_column(default=datetime.now)
    actualizado_en: Mapped[Optional[datetime]] = mapped_column(onupdate=datetime.now)
    
    # Si creado_por es un string (como parece en tu schema):
    creado_por: Mapped[Optional[str]] = mapped_column(String(100))
    actualizado_por: Mapped[Optional[str]] = mapped_column(String(100))
    # --------------------------

    # Relaciones
    equipo = relationship("Equipo", back_populates="inscripciones")
    torneo = relationship("Torneo")
