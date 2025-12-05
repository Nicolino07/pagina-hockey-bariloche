from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey
from app.database import Base



class Equipo(Base):
    __tablename__ = "equipo"

    id_equipo: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    id_club: Mapped[int] = mapped_column(ForeignKey("club.id_club", ondelete="CASCADE"))
    categoria: Mapped[str] = mapped_column(String(50), nullable=False)
    genero: Mapped[str] = mapped_column(String(20), nullable=False)

     # relación inversa
    planteles = relationship("Plantel", back_populates="equipo")