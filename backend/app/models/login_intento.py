from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, String, TIMESTAMP, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class LoginIntento(Base):
    """Intentos de login por email, para el bloqueo temporal por cuenta.

    La clave es el email normalizado tal como se tipeó, exista o no la cuenta:
    así el bloqueo se comporta igual en ambos casos y no revela qué emails
    están registrados. Ver app/auth/bloqueo.py.
    """
    __tablename__ = "login_intento"
    __table_args__ = (
        Index("ix_login_intento_ultimo_intento", "ultimo_intento"),
    )

    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    intentos: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    ultimo_intento: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    bloqueado_hasta: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP)
