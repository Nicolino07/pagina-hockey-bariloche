from datetime import datetime
from typing import Optional

from sqlalchemy import (
    String,
    Text,
    Boolean,
    Integer,
    TIMESTAMP,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import TipoUsuario  # enum tipo_usuario


class Usuario(Base):
    __tablename__ = "usuario"

    __table_args__ = (
        CheckConstraint("username <> ''", name="chk_usuario_username_no_vacio"),
        CheckConstraint("password_hash <> ''", name="chk_usuario_password_no_vacio"),
        CheckConstraint(
            "bloqueado_hasta IS NULL OR bloqueado_hasta > creado_en",
            name="chk_usuario_bloqueo"
        ),
    )

    id_usuario: Mapped[int] = mapped_column(primary_key=True)

    username: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True
    )

    email: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True
    )

    password_hash: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    tipo: Mapped[TipoUsuario] = mapped_column(
        nullable=False,
        default=TipoUsuario.LECTOR
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    intentos_fallidos: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    bloqueado_hasta: Mapped[Optional[datetime]]
    ultimo_login: Mapped[Optional[datetime]]

    creado_en: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        default=datetime.utcnow,
        nullable=False
    )

    actualizado_en: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    creado_por: Mapped[Optional[str]] = mapped_column(String(100))
    actualizado_por: Mapped[Optional[str]] = mapped_column(String(100))
