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
        Enum(RolPersonaTipo, name="tipo_rol_persona"),
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





class TablaPosicionesAnual(Base):
    """Fila de `vw_tabla_posiciones_anual`: la campaña de un equipo en el año.

    Suma de los torneos que la temporada marcó como REGULAR. `puesto` viene
    resuelto desde la vista (puntos → diferencia de gol → goles a favor) porque
    es la misma consulta que define el corte de clasificación al playoff anual.
    """
    __tablename__ = "vw_tabla_posiciones_anual"
    __table_args__ = {"info": {"is_view": True}}

    id_temporada: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_equipo: Mapped[int] = mapped_column(Integer, primary_key=True)

    temporada: Mapped[str] = mapped_column(String)
    anio: Mapped[int] = mapped_column(Integer)
    categoria: Mapped[str] = mapped_column(String)
    division: Mapped[str | None] = mapped_column(String)
    genero: Mapped[str] = mapped_column(String)

    equipo: Mapped[str] = mapped_column(String)
    id_club: Mapped[int] = mapped_column(Integer)

    torneos_computados: Mapped[int] = mapped_column(Integer)
    partidos_jugados: Mapped[int] = mapped_column(Integer)
    ganados: Mapped[int] = mapped_column(Integer)
    empatados: Mapped[int] = mapped_column(Integer)
    perdidos: Mapped[int] = mapped_column(Integer)
    goles_a_favor: Mapped[int] = mapped_column(Integer)
    goles_en_contra: Mapped[int] = mapped_column(Integer)
    diferencia_gol: Mapped[int] = mapped_column(Integer)
    puntos: Mapped[int] = mapped_column(Integer)
    puesto: Mapped[int] = mapped_column(Integer)
