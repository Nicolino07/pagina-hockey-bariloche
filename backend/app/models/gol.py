from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, ForeignKey
from app.database import Base


class Gol(Base):
    __tablename__ = "gol"

    id_gol: Mapped[int] = mapped_column(primary_key=True)
    id_partido: Mapped[int] = mapped_column(ForeignKey("partido.id_partido", ondelete="CASCADE"))
    id_participante_partido: Mapped[int] = mapped_column(ForeignKey("participan_partido.id_participante_partido"))
    minuto: Mapped[int | None]
    cuarto: Mapped[int | None]
    es_autogol: Mapped[bool | None]
