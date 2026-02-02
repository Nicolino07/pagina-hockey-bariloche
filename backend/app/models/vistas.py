from datetime import date
from sqlalchemy import Integer, String, Boolean, Date, Enum
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import RolPersonaTipo


class ClubPersonaRol(Base):
    __tablename__ = "vw_club_personas_roles"
    __table_args__ = {"info": {"is_view": True}}

    id_club: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_persona: Mapped[int] = mapped_column(Integer, primary_key=True)
    rol: Mapped[RolPersonaTipo] = mapped_column(
        Enum(RolPersonaTipo, name="rolpersonatipo"),
        primary_key=True
    )

    nombre: Mapped[str] = mapped_column(String)
    apellido: Mapped[str] = mapped_column(String)
    documento: Mapped[int | None] = mapped_column(Integer)

    origen_rol: Mapped[str] = mapped_column(String)

    id_equipo: Mapped[int | None] = mapped_column(Integer)
    id_plantel: Mapped[int | None] = mapped_column(Integer)

    fecha_inicio: Mapped[date] = mapped_column(Date)
    fecha_fin: Mapped[date | None] = mapped_column(Date)

    activo: Mapped[bool] = mapped_column(Boolean)
