from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, CheckConstraint
from app.database import Base



class Equipo(Base):
    __tablename__ = "equipo"

    __table_args__ = (
        CheckConstraint("nombre <> ''", name="chk_equipo_nombre_no_vacio"),
        CheckConstraint("categoria <> ''", name="chk_equipo_categoria_no_vacio"),
        CheckConstraint("genero IN ('Femenino', 'Masculino', 'Mixto')", name="chk_equipo_genero_valido"),
    )

    id_equipo: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    id_club: Mapped[int] = mapped_column(ForeignKey("club.id_club", ondelete="CASCADE"))
    categoria: Mapped[str] = mapped_column(String(50), nullable=False)
    genero: Mapped[str] = mapped_column(String(20), nullable=False)

     # relación inversa
    planteles = relationship("Plantel", back_populates="equipo")