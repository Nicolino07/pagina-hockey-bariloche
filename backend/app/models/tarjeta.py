from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey
from app.database import Base


class Tarjeta(Base):
    __tablename__ = "tarjeta"

    id_tarjeta: Mapped[int] = mapped_column(primary_key=True)
    id_partido: Mapped[int] = mapped_column(ForeignKey("partido.id_partido", ondelete="CASCADE"))
    id_participante_partido: Mapped[int] = mapped_column(ForeignKey("participan_partido.id_participante_partido"))
    tipo: Mapped[str]
    minuto: Mapped[int | None]
    cuarto: Mapped[int | None]
    observaciones: Mapped[str | None]
