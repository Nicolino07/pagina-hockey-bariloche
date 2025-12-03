from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, ForeignKey
from app.database import Base


class Posicion(Base):
    __tablename__ = "posicion"

    id_posicion: Mapped[int] = mapped_column(primary_key=True)
    id_torneo: Mapped[int] = mapped_column(ForeignKey("torneo.id_torneo"))
    id_equipo: Mapped[int] = mapped_column(ForeignKey("equipo.id_equipo"))
    puntos: Mapped[int | None]
    partidos_jugados: Mapped[int | None]
    ganados: Mapped[int | None]
    empatados: Mapped[int | None]
    perdidos: Mapped[int | None]
    goles_a_favor: Mapped[int | None]
    goles_en_contra: Mapped[int | None]
    diferencia_gol: Mapped[int | None]  # campo generado
    fecha_actualizacion: Mapped[str | None]
