from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class FixturePlayoffRonda(Base):
    __tablename__ = "fixture_playoff_ronda"

    id_fixture_playoff_ronda: Mapped[int] = mapped_column(primary_key=True)
    id_torneo: Mapped[int] = mapped_column(
        ForeignKey("torneo.id_torneo", ondelete="CASCADE"), nullable=False
    )
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    orden: Mapped[int] = mapped_column(Integer, nullable=False)
    ida_y_vuelta: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP, default=datetime.utcnow)
    creado_por: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    torneo = relationship("Torneo", backref="playoff_rondas")
    partidos = relationship("FixturePartido", back_populates="playoff_ronda", cascade="all, delete-orphan")
