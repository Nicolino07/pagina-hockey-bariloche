from datetime import date, datetime
from typing import Optional

from app.models.mixins import AuditFieldsMixin
from sqlalchemy import Date, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import RolPersonaTipo


class PersonaRol(Base, AuditFieldsMixin):
    __tablename__ = "persona_rol"

    __table_args__ = (
        CheckConstraint(
            "fecha_hasta IS NULL OR fecha_hasta > fecha_desde",
            name="chk_persona_rol_fechas_validas"
        ),
    )

    id_persona_rol: Mapped[int] = mapped_column(primary_key=True)

    id_persona: Mapped[int] = mapped_column(
        ForeignKey("persona.id_persona", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False
    )

    rol: Mapped[RolPersonaTipo] = mapped_column(
        nullable=False
    )

    fecha_desde: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        default=date.today
    )

    fecha_hasta: Mapped[Optional[date]] = mapped_column(Date)


    # Relaciones (opcional pero recomendable)
    persona = relationship("Persona", backref="roles")
