from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, CheckConstraint, ForeignKey
from app.database import Base
from datetime import date

class PersonaRol(Base):
    __tablename__ = "persona_rol"

    __table_args__ = (
        CheckConstraint(
            "rol IN ('jugador', 'entrenador', 'arbitro')",
            name="chk_rol_valid"
        ),
    )

    id_persona_rol: Mapped[int] = mapped_column(primary_key=True)
    id_persona: Mapped[int] = mapped_column( ForeignKey("persona.id_persona", ondelete="CASCADE"), nullable=False)
    rol: Mapped[str] = mapped_column(String(30), nullable=False)
    fecha_desde: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    fecha_hasta: Mapped[date | None] = mapped_column(Date)

    persona = relationship("Persona", back_populates="roles")