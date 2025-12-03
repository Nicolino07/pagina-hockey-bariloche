from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Date
from datetime import date
from app.database import Base


class Arbitro(Base):
    __tablename__ = "arbitro"

    id_arbitro: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    fecha_nacimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    dni: Mapped[str | None] = mapped_column(String(20), unique=True)
    telefono: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(100))
