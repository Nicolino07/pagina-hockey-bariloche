from datetime import datetime
from typing import Optional, Any

from sqlalchemy import (
    String,
    Text,
    CheckConstraint,
    TIMESTAMP,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import INET
from app.models.base import Base


class AuditoriaLog(Base):
    # NOTA: los nombres de columna reflejan la tabla real (db/init/008_auditoria.sql).
    # La vista vw_auditoria expone alias distintos (id_log, usuario, fecha_hora) para
    # el backoffice; no confundir con estos.
    __tablename__ = "auditoria_log"

    __table_args__ = (
        CheckConstraint(
            "operacion IN ('INSERT', 'UPDATE', 'DELETE')",
            name="chk_auditoria_operacion_valida"
        ),
    )

    id_auditoria: Mapped[int] = mapped_column(primary_key=True)

    tabla_afectada: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    id_registro: Mapped[Optional[str]] = mapped_column()

    operacion: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    valores_anteriores: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)
    valores_nuevos: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)

    id_usuario: Mapped[Optional[int]] = mapped_column(
        ForeignKey("usuario.id_usuario")
    )

    fecha_cambio: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        server_default=func.now(),
        nullable=False
    )

    ip_address: Mapped[Optional[str]] = mapped_column(INET)
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
