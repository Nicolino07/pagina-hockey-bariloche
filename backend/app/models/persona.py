from app.models.plantel_integrante import PlantelIntegrante
from app.models.persona_rol import PersonaRol
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, CheckConstraint, Integer
from app.database import Base
from datetime import date
from typing import List


class Persona(Base):
    __tablename__ = "persona"

    __table_args__ = (
        CheckConstraint("nombre <> ''", name="chk_persona_nombre_no_vacio"),
        CheckConstraint("apellido <> ''", name="chk_persona_apellido_no_vacio"),
        CheckConstraint(
            "genero IN ('Femenino', 'Masculino', 'Otro')",
            name="chk_persona_genero_valido"
        ),
    )

    id_persona: Mapped[int] = mapped_column(primary_key=True)
    dni: Mapped[int | None] = mapped_column(Integer, unique=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    genero: Mapped[str] = mapped_column(String(20), nullable=False)
    fecha_nacimiento: Mapped[date | None] = mapped_column(Date)
    telefono: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(100))
    direccion: Mapped[str | None] = mapped_column(String(200))

    # Relaciones
    planteles: Mapped[List["PlantelIntegrante"]] = relationship(
        "PlantelIntegrante",
        back_populates="persona"
    )

    roles: Mapped[List["PersonaRol"]] = relationship(
        "PersonaRol",
        back_populates="persona",
        cascade="all, delete-orphan"
    )
