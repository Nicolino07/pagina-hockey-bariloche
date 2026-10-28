from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, CheckConstraint
from app.models.base import Base
from datetime import datetime
from typing import Optional
from app.models.mixins import AuditFieldsMixin, SoftDeleteMixin


class Club(Base, AuditFieldsMixin, SoftDeleteMixin):
    __tablename__ = "club"

    __table_args__ = (
        CheckConstraint("nombre <> ''", name="chk_club_nombre_no_vacio"),
        
    )

    id_club: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    provincia: Mapped[str | None] = mapped_column(String(100))
    ciudad: Mapped[str | None] = mapped_column(String(100))
    direccion: Mapped[str | None] = mapped_column(String(200))
    telefono: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(100))

    

