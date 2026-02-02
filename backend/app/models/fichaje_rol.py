from datetime import date
from typing import Optional

from sqlalchemy import Date, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import AuditFieldsMixin, SoftDeleteMixin
from app.models.enums import RolPersonaTipo # tu enum


class FichajeRol(Base, AuditFieldsMixin, SoftDeleteMixin):
    __tablename__ = "fichaje_rol"

    id_fichaje_rol: Mapped[int] = mapped_column(primary_key=True)

    id_persona: Mapped[int] = mapped_column(
        ForeignKey("persona.id_persona", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )

    id_club: Mapped[int] = mapped_column(
        ForeignKey("club.id_club", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )

    id_persona_rol: Mapped[int] = mapped_column(
        ForeignKey("persona_rol.id_persona_rol", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )

    rol: Mapped[RolPersonaTipo] = mapped_column(
        nullable=False
    )

    fecha_inicio: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        default=date.today,
    )

    fecha_fin: Mapped[Optional[date]] = mapped_column(Date)

    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # relaciones (opcional pero recomendado)
    persona = relationship("Persona")
    club = relationship("Club")
