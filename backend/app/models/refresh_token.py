from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Text,
    Boolean,
    TIMESTAMP,
    CheckConstraint,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class RefreshToken(Base):
    __tablename__ = "refresh_token"

    __table_args__ = (
        CheckConstraint(
            "token_hash <> ''",
            name="chk_refresh_token_hash_no_vacio"
        ),
        CheckConstraint(
            "expires_at > created_at",
            name="chk_refresh_token_expires_future"
        ),
        CheckConstraint(
            "(revoked = TRUE AND revoked_at IS NOT NULL) "
            "OR (revoked = FALSE AND revoked_at IS NULL)",
            name="chk_refresh_token_revoked_at"
        ),
    )

    id_refresh_token: Mapped[int] = mapped_column(primary_key=True)

    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"),
        nullable=False
    )

    token_hash: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    expires_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False
    )

    revoked: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )

    revoked_at: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        default=datetime.utcnow
    )

    created_by_ip: Mapped[Optional[str]]
    user_agent: Mapped[Optional[str]]

    # relación (opcional pero muy útil)
    usuario = relationship(
        "Usuario",
        backref="refresh_tokens",
        lazy="joined"
    )
