from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, ForeignKey
from app.database import Base

class Suspension(Base):
    __tablename__ = "suspension"

    id_suspension: Mapped[int] = mapped_column(primary_key=True)
    id_persona_rol: Mapped[int] = mapped_column(ForeignKey("persona_rol.id_persona_rol"), nullable=False)
    cantidad_partidos: Mapped[int]
    motivo: Mapped[str | None]
    fecha_inicio: Mapped[str | None]
    fecha_fin: Mapped[str | None]           
    partidos_cumplidos: Mapped[int | None]
    fecha_actualizacion: Mapped[str | None]
    estado: Mapped[str | None]  


    




