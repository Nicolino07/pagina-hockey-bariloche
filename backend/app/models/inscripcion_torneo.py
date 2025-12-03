from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Date, ForeignKey
from app.database import Base
from datetime import date

class InscripcionTorneo(Base):
    __tablename__ = "inscripcion_torneo"

    id_inscripcion: Mapped[int] = mapped_column(primary_key=True)
    id_equipo: Mapped[int] = mapped_column(ForeignKey("equipo.id_equipo"))
    id_torneo: Mapped[int] = mapped_column(ForeignKey("torneo.id_torneo", ondelete="CASCADE"))
    categoria: Mapped[str] = mapped_column(String(50), nullable=False)
    genero: Mapped[str] = mapped_column(String(20), nullable=False)
    fecha_inscripcion: Mapped[date | None]
