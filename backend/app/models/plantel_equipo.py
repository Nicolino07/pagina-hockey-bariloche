from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, ForeignKey, String, Date
from app.database import Base
from datetime import date

class PlantelEquipo(Base):
    __tablename__ = "plantel_equipo"

    id_plantel: Mapped[int] = mapped_column(primary_key=True)
    id_equipo: Mapped[int] = mapped_column(ForeignKey("equipo.id_equipo", ondelete="CASCADE"))
    id_jugador: Mapped[int | None] = mapped_column(ForeignKey("jugador.id_jugador"))
    id_entrenador: Mapped[int | None] = mapped_column(ForeignKey("entrenador.id_entrenador"))

    posicion: Mapped[str | None] = mapped_column(String(50))
    fecha_alta: Mapped[date | None]
    fecha_baja: Mapped[date | None]

