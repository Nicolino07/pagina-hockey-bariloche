from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
from app.database import Base
from datetime import date

class Torneo(Base):
    __tablename__ = "torneo"

    id_torneo: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    categoria: Mapped[str] = mapped_column(String(20), nullable=False)
    genero: Mapped[str] = mapped_column(String(20), nullable=False)
    fecha_inicio: Mapped[date | None]
    fecha_fin: Mapped[date | None]
    activo: Mapped[bool | None]
