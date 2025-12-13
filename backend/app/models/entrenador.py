from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Date, CheckConstraint, Integer
from app.database import Base
from datetime import date


class Entrenador(Base):
    __tablename__ = "entrenador"

    __table_args__ = (
        CheckConstraint("nombre <> ''", name="chk_entrenador_nombre_no_vacio"),
        CheckConstraint("apellido <> ''", name="chk_entrenador_apellido_no_vacio"),
    )

    id_entrenador: Mapped[int] = mapped_column(primary_key=True)
    dni: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    fecha_nacimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(100))
