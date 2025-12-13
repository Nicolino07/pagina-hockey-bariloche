from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Time, ForeignKey, Integer
from app.database import Base
from datetime import date

class Partido(Base):
    __tablename__ = "partido"

    id_partido: Mapped[int] = mapped_column(primary_key=True)
    id_torneo: Mapped[int] = mapped_column(ForeignKey("torneo.id_torneo", ondelete="CASCADE"))
    id_fase: Mapped[int | None] = mapped_column(ForeignKey("fase.id_fase"))
    fecha: Mapped[date | None]
    horario: Mapped[Time | None]
    id_local: Mapped[int] = mapped_column(ForeignKey("equipo.id_equipo"))
    id_visitante: Mapped[int] = mapped_column(ForeignKey("equipo.id_equipo"))
    goles_local: Mapped[int | None]
    goles_visitante: Mapped[int | None]
    id_arbitro1: Mapped[int | None] = mapped_column(ForeignKey("arbitro.id_arbitro"))
    id_arbitro2: Mapped[int | None] = mapped_column(ForeignKey("arbitro.id_arbitro"))
    capitan_local: Mapped[int | None] = mapped_column(ForeignKey("participan_partido.id_participante_partido"))
    capitan_visitante: Mapped[int | None] = mapped_column(ForeignKey("participan_partido.id_participante_partido"))
    juez_mesa_local: Mapped[str | None] = mapped_column(String(100))
    juez_mesa_visitante: Mapped[str | None] = mapped_column(String(100))
    ubicacion: Mapped[str | None] = mapped_column(String(200))
    observaciones: Mapped[str | None] = mapped_column(String(1000))
    tipo_fase: Mapped[str]
    numero_fecha: Mapped[int | None]


