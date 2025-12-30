from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, ForeignKey
from app.database import Base


class ParticipanPartido(Base):
    __tablename__ = "participan_partido"

    id_participante_partido: Mapped[int] = mapped_column(primary_key=True)
    id_partido: Mapped[int] = mapped_column(ForeignKey("partido.id_partido", ondelete="CASCADE"))
    id_plantel: Mapped[int] = mapped_column(ForeignKey("plantel.id_plantel"))
    numero_camiseta: Mapped[int]
