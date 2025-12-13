from datetime import date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Date
from sqlalchemy.sql import func
from app.database import Base


class Plantel(Base):
    __tablename__ = "plantel"

    id_plantel: Mapped[int] = mapped_column(primary_key=True, index=True)

    id_equipo: Mapped[int] = mapped_column(
        ForeignKey("equipo.id_equipo", ondelete="CASCADE"),
        nullable=False
    )

    temporada: Mapped[str | None] = mapped_column(String(20))

    fecha_creacion: Mapped[date | None] = mapped_column(
        Date,
        server_default=func.current_date(),  # valor desde la DB
        nullable=True                         # SQLAlchemy devuelve None si no refrescas
    )

    equipo: Mapped["Equipo"] = relationship(back_populates="planteles")

    integrantes: Mapped[list["PlantelIntegrante"]] = relationship(
        back_populates="plantel",
        cascade="all, delete"
    )


class PlantelIntegrante(Base):
    __tablename__ = "plantel_integrante"

    id_plantel_integrante: Mapped[int] = mapped_column(primary_key=True, index=True)

    id_plantel: Mapped[int] = mapped_column(
        ForeignKey("plantel.id_plantel", ondelete="CASCADE"),
        nullable=False
    )

    id_jugador: Mapped[int | None] = mapped_column(ForeignKey("jugador.id_jugador"))
    id_entrenador: Mapped[int | None] = mapped_column(ForeignKey("entrenador.id_entrenador"))

    rol: Mapped[str] = mapped_column(String(50), nullable=False)
    numero_camiseta: Mapped[int | None]

    fecha_alta: Mapped[date | None] = mapped_column(
        Date,
        server_default=func.current_date(),
        nullable=True
    )

    fecha_baja: Mapped[date | None]

    plantel: Mapped["Plantel"] = relationship(back_populates="integrantes")
    jugador: Mapped["Jugador"] = relationship()
    entrenador: Mapped["Entrenador"] = relationship()
