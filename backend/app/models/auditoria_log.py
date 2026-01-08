from datetime import datetime
from typing import Optional, Any

from sqlalchemy import (
    String,
    Text,
    JSON,
    CheckConstraint,
    TIMESTAMP,
    Inet,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuditoriaLog(Base):
    __tablename__ = "auditoria_log"

    __table_args__ = (
        CheckConstraint(
            "operacion IN ('INSERT', 'UPDATE', 'DELETE')",
            name="chk_auditoria_operacion_valida"
        ),
    )

    id_log: Mapped[int] = mapped_column(primary_key=True)

    tabla_afectada: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    id_registro: Mapped[Optional[str]] = mapped_column()

    operacion: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    valores_anteriores: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON)
    valores_nuevos: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON)

    usuario: Mapped[Optional[str]] = mapped_column(String(100))

    fecha_hora: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        default=datetime.utcnow,
        nullable=False
    )

    ip_address: Mapped[Optional[str]] = mapped_column(Inet)
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
