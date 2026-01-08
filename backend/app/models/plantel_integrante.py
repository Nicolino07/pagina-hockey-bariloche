from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import RolPersona


class PlantelIntegrante(Base):
    __tablename__ = "plantel_integrante"

    __table_args__ = (
        CheckConstraint("numero_camiseta > 0", name="chk_numero_camiseta_valido"),
    )

    id_plantel_integrante: Mapped[int] = mapped_column(primary_key=True)

    id_plantel: Mapped[int] = mapped_column(
        ForeignKey("plantel.id_plantel", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )

    id_persona: Mapped[int] = mapped_column(
        ForeignKey("persona.id_persona", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )

    rol_en_plantel: Mapped[RolPersona] = mapped_column(nullable=False)

    numero_camiseta: Mapped[Optional[int]]

    fecha_alta: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

    fecha_baja: Mapped[Optional[date]]

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

    creado_por: Mapped[Optional[str]]
    actualizado_por: Mapped[Optional[str]]

    # Relaciones
    plantel = relationship("Plantel", back_populates="integrantes")
    persona = relationship("Persona")
    participaciones = relationship(
        "ParticipanPartido",
        back_populates="plantel_integrante"
    )
