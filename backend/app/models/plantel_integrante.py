from datetime import date, datetime
from typing import Optional

from app.models.mixins import AuditFieldsMixin
from sqlalchemy import Date, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import RolPersonaTipo


class PlantelIntegrante(Base, AuditFieldsMixin):
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

    id_fichaje_rol: Mapped[int] = mapped_column(
        ForeignKey("fichaje_rol.id_fichaje_rol", onupdate="CASCADE", ondelete="SET NULL"),
        nullable=False
    )
    
    rol_en_plantel: Mapped[RolPersonaTipo] = mapped_column(nullable=False)

    numero_camiseta: Mapped[Optional[int]]

    fecha_alta: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

    fecha_baja: Mapped[Optional[date]]

    # Relaciones
    plantel = relationship("Plantel", back_populates="integrantes")
    persona = relationship("Persona")
    participaciones = relationship(
        "ParticipanPartido",
        back_populates="plantel_integrante"
    )
