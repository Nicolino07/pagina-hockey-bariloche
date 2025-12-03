from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Date, ForeignKey, Integer
from app.database import Base
from datetime import date


class Fase(Base):
    __tablename__ = "fase"

    id_fase: Mapped[int] = mapped_column(primary_key=True)
    torneo_id: Mapped[int] = mapped_column(ForeignKey("torneo.id_torneo", ondelete="CASCADE"))
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    orden: Mapped[int | None]
    fecha_inicio: Mapped [date | None]
    fecha_fin: Mapped [date | None]
