from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, ForeignKey, CheckConstraint
from app.database import Base


class Gol(Base):
    __tablename__ = "gol"

    __table_args__ = (
        CheckConstraint("minuto >= 0", name="chk_gol_minuto_no_negativo"),
        CheckConstraint("cuarto BETWEEN 1 AND 4", name="chk_gol_cuarto_valido"),
        CheckConstraint("referencia_gol IN ('GJ', 'GC', 'GP', 'DP')", name="chk_gol_referencia_valida"),
    )

    id_gol: Mapped[int] = mapped_column(primary_key=True)
    id_partido: Mapped[int] = mapped_column(ForeignKey("partido.id_partido", ondelete="CASCADE"))
    id_participante_partido: Mapped[int] = mapped_column(ForeignKey("participan_partido.id_participante_partido"))
    minuto: Mapped[int | None]
    cuarto: Mapped[int | None]
    referencia_gol: Mapped[str | None]
    es_autogol: Mapped[bool | None]



