from sqlalchemy.orm import Mapped, mapped_column,relationship
from sqlalchemy import String, Date, CheckConstraint, Integer
from app.database import Base
from datetime import date


class Jugador(Base):
    __tablename__ = "jugador"

    __table_args__ = (
        CheckConstraint("nombre <> ''", name="chk_jugador_nombre_no_vacio"),
        CheckConstraint("apellido <> ''", name="chk_jugador_apellido_no_vacio"),
        CheckConstraint("genero IN ('Femenino', 'Masculino')", name="chk_jugador_genero_valido"),
    )

    id_jugador: Mapped[int] = mapped_column(primary_key=True)
    dni: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str | None] = mapped_column(String(100))
    genero: Mapped[str] = mapped_column(String(20), nullable=False)
    fecha_nacimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(100))

    relationship("PlantelIntegrante", back_populates="jugador")
    