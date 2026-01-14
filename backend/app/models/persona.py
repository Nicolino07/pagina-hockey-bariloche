from datetime import datetime, date
from typing import Optional

from app.models.mixins import AuditFieldsMixin, SoftDeleteMixin
from sqlalchemy import String, Date, Integer, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import GeneroPersonaTipo


class Persona(Base, AuditFieldsMixin, SoftDeleteMixin):
    __tablename__ = "persona"

    __table_args__ = (
        CheckConstraint("documento > 0", name="chk_persona_documento_valido"),
        CheckConstraint("nombre <> ''", name="chk_persona_nombre_no_vacio"),
        CheckConstraint("apellido <> ''", name="chk_persona_apellido_no_vacio"),
    )

    id_persona: Mapped[int] = mapped_column(primary_key=True)

    documento: Mapped[Optional[int]] = mapped_column(
        Integer,
        unique=True
    )

    nombre: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    apellido: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    fecha_nacimiento: Mapped[Optional[date]] = mapped_column(Date)

    genero: Mapped[GeneroPersonaTipo] = mapped_column(
        nullable=False
    )

    telefono: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(100))
    direccion: Mapped[Optional[str]] = mapped_column(String(200))

